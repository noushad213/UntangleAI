const Workflow = require("../models/Workflow");
const Source = require("../models/Source");
const { makeError } = require("../utils/errors");
const { validateWorkflow } = require("../validators/workflow.validator");
const municipalityService = require("./municipality.service");
const aiService = require("./ai.service");
const searchService = require("./search.service");
const extractionService = require("./extraction.service");
const { selectTopChunks } = require("./relevance.service");
const logger = require("../utils/logger");

const MAX_SOURCES_PER_WORKFLOW = 4;
const MAX_TOTAL_GEMINI_CHUNKS = 10;

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
  const municipality = await municipalityService.getMunicipalityBySlug(
    municipalitySlug
  );

  // Step 1: classify intent against this municipality's known issue catalog.
  const classification = await aiService.classifyIntent(
    rawQuery,
    municipality.name,
    municipality.issueCatalog
  );

  if (!classification.issueKey || classification.confidence < 0.4) {
    throw makeError(
      "ISSUE_NOT_RECOGNIZED",
      "Could not confidently match query to a known issue",
      {
        classification,
      }
    );
  }

  const issue = municipalityService.findIssueInCatalog(
    municipality,
    classification.issueKey
  );

  // Step 2: MongoDB first. Only fall through to discovery if forced or missing.
  if (!opts.forceRefresh) {
    const cached = await getCachedWorkflow(
      municipality._id,
      issue.issueKey
    );

    if (cached && cached.status !== "outdated") {
      logger.info("Workflow cache hit", {
        municipality: municipality.slug,
        issueKey: issue.issueKey,
      });

      return {
        workflow: cached,
        classification,
        fromCache: true,
      };
    }
  }

  // Step 3: discovery + extraction.
  // Pass the original user query so chunks can be ranked according to
  // exactly what the user asked.
  const workflow = await buildWorkflowFromScratch(
    municipality,
    issue,
    rawQuery
  );

  return {
    workflow,
    classification,
    fromCache: false,
  };
}

async function buildWorkflowFromScratch(
  municipality,
  issue,
  rawQuery
) {
  const candidates = await searchService.searchGovernmentSources(
    issue.label,
    municipality.name,
    municipality.allowedDomains
  );

  if (!candidates.length) {
    throw makeError(
      "NO_RELIABLE_SOURCES",
      "No candidate sources found for this issue"
    );
  }

  const usable = candidates.slice(0, MAX_SOURCES_PER_WORKFLOW);
  const sourceDocs = [];

  for (const candidate of usable) {
    try {
      const domain = new URL(candidate.url).hostname;

      let sourceDoc = await getCachedSource(
        municipality._id,
        candidate.url
      );

      if (
        !sourceDoc ||
        sourceDoc.extractionStatus !== "success" ||
        !sourceDoc.quality?.usable
      ) {
        const extracted = await extractionService.fetchAndExtract(
          candidate.url,
          municipality.allowedDomains
        );

        sourceDoc = await Source.findOneAndUpdate(
          {
            municipalityId: municipality._id,
            url: candidate.url,
          },
          {
            municipalityId: municipality._id,
            url: candidate.url,
            domain,
            documentType: extracted.documentType,
            extractedText: extracted.extractedText,
            contentHash: extracted.contentHash,
            resolvedUrl: extracted.finalUrl,
            retrievalMethod: extracted.retrievalMethod,
            extractionMethod: extracted.extractionMethod,
            pages: extracted.pages,
            chunks: extracted.chunks,
            quality: extracted.quality,
            attemptedUrls: extracted.attemptedUrls,
            fetchedAt: new Date(),
            lastCheckedAt: new Date(),
            extractionStatus: "success",
            extractionError: null,
          },
          {
            upsert: true,
            new: true,
          }
        );
      }

      sourceDocs.push(sourceDoc);
    } catch (err) {
      logger.warn("Skipping unusable source", {
        url: candidate.url,
        error: err.message,
      });

      // Continue with other candidates; do not fail the whole pipeline
      // for one bad source.
    }
  }

  if (sourceDocs.length === 0) {
    throw makeError(
      "NO_RELIABLE_SOURCES",
      "All candidate sources failed to fetch/parse"
    );
  }

  // ============================================================
  // Step 4: Select only the chunks relevant to the user's query.
  // ============================================================

  const maxChunksPerSource =
    Number(process.env.MAX_GEMINI_CHUNKS_PER_SOURCE) || 4;

  const issueKeywords = Array.isArray(issue.keywords)
    ? issue.keywords
    : [];

  const rankedSourceChunks = sourceDocs.map((source) => {
    const chunks =
      Array.isArray(source.chunks) && source.chunks.length
        ? source.chunks
        : [
            {
              chunkId: "legacy-1",
              text: (source.extractedText || "").slice(0, 6000),
              pageStart: 1,
              pageEnd: 1,
              sectionType: "general_information",
              sectionPriority: 30,
            },
          ];

    const selectedChunks = selectTopChunks(
      chunks,
      rawQuery,
      issueKeywords,
      maxChunksPerSource
    );

    return {
      source,
      chunks: selectedChunks,
    };
  });

  // ============================================================
  // Step 5: Build AI input from ranked chunks.
  // Also enforce a global maximum so the AI doesn't receive
  // unnecessary source material.
  // ============================================================

  const geminiInput = rankedSourceChunks
    .flatMap(({ source, chunks }) =>
      chunks.map((chunk) => ({
        sourceId: String(source._id),
        chunkId: chunk.chunkId,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
        sectionType: chunk.sectionType,
        sectionPriority: chunk.sectionPriority,
        relevanceScore: chunk.relevanceScore,
        text: chunk.text,
      }))
    )
    .sort((a, b) => {
      return (b.relevanceScore || 0) - (a.relevanceScore || 0);
    })
    .slice(0, MAX_TOTAL_GEMINI_CHUNKS);

  if (geminiInput.length === 0) {
    throw makeError(
      "NO_RELEVANT_SOURCE_CONTENT",
      "No relevant source content was found for the user's query"
    );
  }

  logger.info("Selected relevant AI chunks", {
    query: rawQuery,
    issueKey: issue.issueKey,
    totalSources: sourceDocs.length,
    totalChunksSentToAI: geminiInput.length,
    maxChunksPerSource,
    maxTotalChunks: MAX_TOTAL_GEMINI_CHUNKS,
  });

  console.log("\n===== AI INPUT =====");
  console.dir(geminiInput, { depth: null });
  console.log("====================\n");

  // ============================================================
  // Step 6: AI extraction, grounded only in selected
  // relevant source text.
  //
  // ai.service.js handles:
  // Gemini -> Groq fallback
  // ============================================================

  const extraction = await aiService.extractWorkflow(
    issue.label,
    geminiInput
  );

  const validSourceIds = new Set(
    sourceDocs.map((s) => String(s._id))
  );

  // Never trust a URL emitted by the AI.
  // Derive it from the original source record so frontend links
  // always point to an official URL.
  const sourceById = new Map(
    sourceDocs.map((source) => [
      String(source._id),
      source,
    ])
  );

  // Keep ALL original chunks here because AI evidence must
  // still be validated against the complete stored source.
  const chunkById = new Map();

  for (const source of sourceDocs) {
    for (const chunk of source.chunks || []) {
      chunkById.set(
        `${String(source._id)}:${chunk.chunkId}`,
        chunk
      );
    }
  }

  const groundedSteps = extraction.steps.map((step) => {
    const sourceIds = Array.isArray(step.sourceIds)
      ? step.sourceIds.map(String)
      : [];

    const evidence = (
      Array.isArray(step.evidence)
        ? step.evidence
        : []
    ).flatMap((item) => {
      const sourceId = sourceIds.find((id) =>
        chunkById.has(`${id}:${item.chunkId}`)
      );

      if (!sourceId) return [];

      const chunk = chunkById.get(
        `${sourceId}:${item.chunkId}`
      );

      return [
        {
          chunkId: chunk.chunkId,
          pageStart: chunk.pageStart ?? null,
          pageEnd: chunk.pageEnd ?? null,
          quote:
            typeof item.quote === "string" &&
            item.quote.length <= 600
              ? item.quote
              : null,
        },
      ];
    });

    return {
      ...step,
      sourceIds,
      evidence,
      officialUrl:
        sourceIds
          .map(
            (sourceId) =>
              sourceById.get(sourceId)?.url
          )
          .find(Boolean) || null,
    };
  });

  const candidateWorkflow = {
    steps: groundedSteps,
    conflicts: extraction.conflicts,
  };

  validateWorkflow(
    candidateWorkflow,
    validSourceIds
  );

  const saved = await Workflow.findOneAndUpdate(
    {
      municipalityId: municipality._id,
      issueKey: issue.issueKey,
    },
    {
      municipalityId: municipality._id,
      issueKey: issue.issueKey,
      title: issue.label,
      steps: groundedSteps,
      conflicts: extraction.conflicts,
      missingInformation: extraction.missingInformation,
      status: "needs_review",
      geminiModel: process.env.GEMINI_MODEL || null,
      lastRecheckedAt: new Date(),
    },
    {
      upsert: true,
      new: true,
    }
  );

  return saved;
}

async function markWorkflowVerified(
  workflowId,
  verifiedBy
) {
  const workflow = await Workflow.findById(
    workflowId
  );

  if (!workflow) {
    throw makeError(
      "NOT_FOUND",
      "Workflow not found"
    );
  }

  workflow.status = "verified";
  workflow.verifiedBy = verifiedBy;
  workflow.verifiedAt = new Date();

  await workflow.save();

  return workflow;
}

/**
 * Converts a workflow document into the graph-ready shape
 * the frontend (React Flow) expects.
 */
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
        evidence: s.evidence,
      },
    })),

    edges: workflow.steps.flatMap((s) =>
      (s.dependsOn || []).map((dep) => ({
        from: dep,
        to: s.stepId,
      }))
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