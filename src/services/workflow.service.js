const Workflow = require("../models/Workflow");
const Source = require("../models/Source");
const { makeError } = require("../utils/errors");
const { validateWorkflow } = require("../validators/workflow.validator");
const municipalityService = require("./municipality.service");
const geminiService = require("./gemini.service");
const searchService = require("./search.service");
const extractionService = require("./extraction.service");
const logger = require("../utils/logger");

const MAX_SOURCES_PER_WORKFLOW = 4;

/**
 * Returns an existing verified/needs_review workflow for municipality+issueKey,
 * or null. This is the FIRST thing every caller should check (API budget rule).
 */
async function getCachedWorkflow(municipalityId, issueKey) {
  return Workflow.findOne({ municipalityId, issueKey }).sort({ updatedAt: -1 });
}

/**
 * Finds an already-fetched, still-fresh source for a URL, or null.
 * Avoids re-fetching/re-extracting identical content.
 */
async function getCachedSource(municipalityId, url) {
  return Source.findOne({ municipalityId, url });
}

/**
 * End-to-end pipeline: natural language query -> normalized issue -> cached
 * workflow OR fresh discovery+extraction -> validated workflow.
 *
 * @param {string} rawQuery
 * @param {string} municipalitySlug
 * @param {{forceRefresh?: boolean}} opts
 */
async function resolveWorkflowForQuery(rawQuery, municipalitySlug, opts = {}) {
  const municipality = await municipalityService.getMunicipalityBySlug(municipalitySlug);

  // Step 1: classify intent against this municipality's known issue catalog.
  const classification = await geminiService.classifyIntent(
    rawQuery,
    municipality.name,
    municipality.issueCatalog
  );

  if (!classification.issueKey || classification.confidence < 0.4) {
    throw makeError("ISSUE_NOT_RECOGNIZED", "Could not confidently match query to a known issue", {
      classification,
    });
  }

  const issue = municipalityService.findIssueInCatalog(municipality, classification.issueKey);

  // Step 2: MongoDB first. Only fall through to discovery if forced or missing.
  if (!opts.forceRefresh) {
    const cached = await getCachedWorkflow(municipality._id, issue.issueKey);
    if (cached && cached.status !== "outdated") {
      logger.info("Workflow cache hit", { municipality: municipality.slug, issueKey: issue.issueKey });
      return { workflow: cached, classification, fromCache: true };
    }
  }

  // Step 3: discovery + extraction (only reached when caching can't answer it).
  const workflow = await buildWorkflowFromScratch(municipality, issue);
  return { workflow, classification, fromCache: false };
}

async function buildWorkflowFromScratch(municipality, issue) {
  const candidates = await searchService.searchGovernmentSources(
    issue.label,
    municipality.name,
    municipality.allowedDomains
  );

  if (!candidates.length) {
    throw makeError("NO_RELIABLE_SOURCES", "No candidate sources found for this issue");
  }

  const usable = candidates.slice(0, MAX_SOURCES_PER_WORKFLOW);
  const sourceDocs = [];

  for (const candidate of usable) {
    try {
      const domain = new URL(candidate.url).hostname;

      let sourceDoc = await getCachedSource(municipality._id, candidate.url);
      if (!sourceDoc || sourceDoc.extractionStatus !== "success") {
        const extracted = await extractionService.fetchAndExtract(
          candidate.url,
          municipality.allowedDomains
        );
        sourceDoc = await Source.findOneAndUpdate(
          { municipalityId: municipality._id, url: candidate.url },
          {
            municipalityId: municipality._id,
            url: candidate.url,
            domain,
            documentType: extracted.documentType,
            extractedText: extracted.extractedText,
            contentHash: extracted.contentHash,
            fetchedAt: new Date(),
            lastCheckedAt: new Date(),
            extractionStatus: "success",
            extractionError: null,
          },
          { upsert: true, new: true }
        );
      }
      sourceDocs.push(sourceDoc);
    } catch (err) {
      logger.warn("Skipping unusable source", { url: candidate.url, error: err.message });
      // Continue with other candidates; do not fail the whole pipeline for one bad source.
    }
  }

  if (sourceDocs.length === 0) {
    throw makeError("NO_RELIABLE_SOURCES", "All candidate sources failed to fetch/parse");
  }

  // Step 4: Gemini extraction, grounded only in fetched source text.
  const geminiInput = sourceDocs.map((s) => ({
    sourceId: String(s._id),
    text: s.extractedText.slice(0, 6000), // keep prompt small per token-optimization rules
  }));

  console.log("\n===== GEMINI INPUT =====");
console.dir(geminiInput, { depth: null });
console.log("========================\n");

  const extraction = await geminiService.extractWorkflow(issue.label, geminiInput);

  const validSourceIds = new Set(sourceDocs.map((s) => String(s._id)));
  const candidateWorkflow = {
    steps: extraction.steps,
    conflicts: extraction.conflicts,
  };
  validateWorkflow(candidateWorkflow, validSourceIds);

  const saved = await Workflow.findOneAndUpdate(
    { municipalityId: municipality._id, issueKey: issue.issueKey },
    {
      municipalityId: municipality._id,
      issueKey: issue.issueKey,
      title: issue.label,
      steps: extraction.steps,
      conflicts: extraction.conflicts,
      missingInformation: extraction.missingInformation,
      status: "needs_review", // never auto-verified
      geminiModel: geminiService.MODEL,
      lastRecheckedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return saved;
}

async function markWorkflowVerified(workflowId, verifiedBy) {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) throw makeError("NOT_FOUND", "Workflow not found");
  workflow.status = "verified";
  workflow.verifiedBy = verifiedBy;
  workflow.verifiedAt = new Date();
  await workflow.save();
  return workflow;
}

/** Converts a workflow document into the graph-ready shape the frontend (React Flow) expects. */
function toGraphJson(workflow) {
  return {
    id: String(workflow._id),
    title: workflow.title,
    status: workflow.status,
    nodes: workflow.steps.map((s) => ({
      id: s.stepId,
      label: s.title,
      data: {
        description: s.description,
        fee: s.fee,
        deadline: s.deadline,
        documentsRequired: s.documentsRequired,
        eligibility: s.eligibility,
        office: s.office,
        officialUrl: s.officialUrl,
        sourceIds: s.sourceIds,
        isUncertain: s.isUncertain,
        uncertaintyNote: s.uncertaintyNote,
      },
    })),
    edges: workflow.steps.flatMap((s) =>
      (s.dependsOn || []).map((dep) => ({ from: dep, to: s.stepId }))
    ),
    conflicts: workflow.conflicts,
    missingInformation: workflow.missingInformation,
  };
}

module.exports = {
  resolveWorkflowForQuery,
  buildWorkflowFromScratch,
  getCachedWorkflow,
  markWorkflowVerified,
  toGraphJson,
};
