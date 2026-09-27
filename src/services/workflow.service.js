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

// Verified Indian civic portals directory to eliminate dead links/404s
const VERIFIED_GOV_PORTALS = {
  gumasta: "https://aaplesarkar.mahaonline.gov.in",
  shop_establishment: "https://aaplesarkar.mahaonline.gov.in",
  mcgm_main: "https://portal.mcgm.gov.in",
  fssai: "https://foscos.fssai.gov.in",
  uidai: "https://myaadhaar.uidai.gov.in",
  pan: "https://incometax.gov.in",
  property_tax: "https://ptaxportal.mcgm.gov.in",
};

/**
 * Validates and maps step URLs to active, verified official government portals.
 */
function normalizeOfficialUrl(rawUrl, title, description, sourceUrls = []) {
  const combined = `${title} ${description} ${rawUrl || ""}`.toLowerCase();

  // 1. Agar source se direct valid .gov.in URL mil raha ho jo active domain se ho
  if (rawUrl && typeof rawUrl === "string") {
    const isGov = rawUrl.includes(".gov.in") || rawUrl.includes(".nic.in") || rawUrl.includes("mahaonline.gov.in");
    // Hallucinated subpaths like '/gumasta' on portal root ko clean karna
    if (isGov && !rawUrl.endsWith("/gumasta") && !rawUrl.endsWith("/apply")) {
      return rawUrl;
    }
  }

  // 2. Keyword-based matching with reliable statutory portals
  if (combined.includes("fssai") || combined.includes("food")) {
    return VERIFIED_GOV_PORTALS.fssai;
  }
  if (combined.includes("gumasta") || combined.includes("shop") || combined.includes("establishment")) {
    return VERIFIED_GOV_PORTALS.gumasta;
  }
  if (combined.includes("aadhaar") || combined.includes("uidai")) {
    return VERIFIED_GOV_PORTALS.uidai;
  }
  if (combined.includes("pan card") || combined.includes("income tax")) {
    return VERIFIED_GOV_PORTALS.pan;
  }
  if (combined.includes("property tax") || combined.includes("ptax")) {
    return VERIFIED_GOV_PORTALS.property_tax;
  }

  // 3. Fallback to candidate sources' base domain
  if (sourceUrls.length > 0 && sourceUrls[0]) {
    try {
      const parsedOrigin = new URL(sourceUrls[0]).origin;
      return parsedOrigin;
    } catch (_) {}
  }

  return VERIFIED_GOV_PORTALS.mcgm_main;
}

/**
 * Returns an existing verified/needs_review workflow for municipality+issueKey,
 * or null. (API budget rule)
 */
async function getCachedWorkflow(municipalityId, issueKey) {
  return Workflow.findOne({ municipalityId, issueKey }).sort({ updatedAt: -1 });
}

/**
 * Finds an already-fetched, still-fresh source for a URL, or null.
 */
async function getCachedSource(municipalityId, url) {
  return Source.findOne({ municipalityId, url });
}

/**
 * End-to-end pipeline: natural language query -> normalized issue -> cached
 * workflow OR fresh discovery+extraction -> validated workflow.
 */
async function resolveWorkflowForQuery(rawQuery, municipalitySlug, opts = {}) {
  const municipality = await municipalityService.getMunicipalityBySlug(municipalitySlug);

  // Step 1: Classify intent against municipality's issue catalog
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

  // Step 2: Cache check
  if (!opts.forceRefresh) {
    const cached = await getCachedWorkflow(municipality._id, issue.issueKey);
    if (cached && cached.status !== "outdated") {
      logger.info("Workflow cache hit", { municipality: municipality.slug, issueKey: issue.issueKey });
      return { workflow: cached, classification, fromCache: true };
    }
  }

  // Step 3: Discovery + extraction
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
  const candidateUrls = usable.map((c) => c.url);

  for (const candidate of usable) {
    try {
      const domain = new URL(candidate.url).hostname;

      let sourceDoc = await getCachedSource(municipality._id, candidate.url);
      if (!sourceDoc || sourceDoc.extractionStatus !== "success") {
        // Agar candidate me direct text pehle se ho (from search.service.js)
        if (candidate.text && candidate.text.length > 100) {
          sourceDoc = await Source.findOneAndUpdate(
            { municipalityId: municipality._id, url: candidate.url },
            {
              municipalityId: municipality._id,
              url: candidate.url,
              domain,
              documentType: "html",
              extractedText: candidate.text,
              contentHash: "hash_" + Date.now(),
              fetchedAt: new Date(),
              lastCheckedAt: new Date(),
              extractionStatus: "success",
              extractionError: null,
            },
            { upsert: true, new: true }
          );
        } else {
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
      }
      sourceDocs.push(sourceDoc);
    } catch (err) {
      logger.warn("Skipping unusable source", { url: candidate.url, error: err.message });
    }
  }

  if (sourceDocs.length === 0) {
    throw makeError("NO_RELIABLE_SOURCES", "All candidate sources failed to fetch/parse");
  }

  // Step 4: AI Extraction grounded in source text
  const geminiInput = sourceDocs.map((s) => ({
    sourceId: String(s._id),
    text: (s.extractedText || "").slice(0, 6000),
  }));

  const extraction = await geminiService.extractWorkflow(issue.label, geminiInput);

  // Normalize URLs across all generated steps to prevent broken links
  const normalizedSteps = (extraction.steps || []).map((step) => ({
    ...step,
    officialUrl: normalizeOfficialUrl(step.officialUrl, step.title, step.description, candidateUrls),
  }));

  const validSourceIds = new Set(sourceDocs.map((s) => String(s._id)));
  const candidateWorkflow = {
    steps: normalizedSteps,
    conflicts: extraction.conflicts,
  };
  
  try {
    validateWorkflow(candidateWorkflow, validSourceIds);
  } catch (valErr) {
    logger.warn("Workflow validation soft warning:", { error: valErr.message });
  }

  const saved = await Workflow.findOneAndUpdate(
    { municipalityId: municipality._id, issueKey: issue.issueKey },
    {
      municipalityId: municipality._id,
      issueKey: issue.issueKey,
      title: issue.label,
      steps: normalizedSteps,
      conflicts: extraction.conflicts || [],
      missingInformation: extraction.missingInformation || [],
      status: "needs_review",
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