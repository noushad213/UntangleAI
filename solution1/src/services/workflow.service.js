const Workflow = require("../models/Workflow");
const Source = require("../models/Source");
const { makeError } = require("../utils/errors");
const {
  validateWorkflow,
} = require("../validators/workflow.validator");

const municipalityService = require("./municipality.service");
const aiService = require("./ai.service");
const searchService = require("./search.service");
const extractionService = require("./extraction.service");
const {
  selectTopChunks,
} = require("./relevance.service");

const logger = require("../utils/logger");

const MAX_SOURCES_PER_WORKFLOW = 4;
const MAX_TOTAL_GEMINI_CHUNKS = 10;

/**
 * Returns an existing workflow for municipality + issueKey.
 *
 * Cache key:
 * municipalityId + issueKey
 */
async function getCachedWorkflow(
  municipalityId,
  issueKey
) {
  return Workflow.findOne({
    municipalityId,
    issueKey,
  }).sort({
    updatedAt: -1,
  });
}

/**
 * Finds an already-fetched source for a URL.
 *
 * Avoids re-fetching/re-extracting identical content.
 */
async function getCachedSource(
  municipalityId,
  url
) {
  return Source.findOne({
    municipalityId,
    url,
  });
}

/**
 * Main end-to-end pipeline:
 *
 * Natural language query
 *        ↓
 * Municipality
 *        ↓
 * AI issue understanding
 *        ↓
 * Stable issueKey
 *        ↓
 * MongoDB cache
 *        ↓
 * Cache HIT
 *        OR
 * Source discovery
 *        ↓
 * Extraction
 *        ↓
 * Relevant chunk selection
 *        ↓
 * Gemini / Groq workflow generation
 *        ↓
 * Validation
 *        ↓
 * MongoDB save
 *        ↓
 * Return workflow
 */
async function resolveWorkflowForQuery(
  rawQuery,
  municipalitySlug,
  opts = {}
) {
  if (
    typeof rawQuery !== "string" ||
    !rawQuery.trim()
  ) {
    throw makeError(
      "INVALID_REQUEST",
      "A civic query is required"
    );
  }

  if (
    typeof municipalitySlug !== "string" ||
    !municipalitySlug.trim()
  ) {
    throw makeError(
      "INVALID_REQUEST",
      "Municipality slug is required"
    );
  }

  const municipality =
    await municipalityService.getMunicipalityBySlug(
      municipalitySlug
    );

  /*
   * ============================================================
   * STEP 1: UNDERSTAND THE USER'S ISSUE
   * ============================================================
   *
   * The catalog is optional context only.
   * New civic issues are allowed.
   */
  const classification =
    await aiService.classifyIntent(
      rawQuery,
      municipality.name,
      municipality.issueCatalog || []
    );

  logger.info(
    "Civic issue classified",
    {
      municipality:
        municipality.slug,

      query:
        rawQuery,

      issueKey:
        classification.issueKey,

      intent:
        classification.intent,

      confidence:
        classification.confidence,
    }
  );

  if (
    !classification ||
    !classification.issueKey ||
    typeof classification.issueKey !==
      "string"
  ) {
    throw makeError(
      "ISSUE_NOT_RECOGNIZED",
      "Could not determine the civic issue from the query",
      {
        classification,
      }
    );
  }

  /*
   * ============================================================
   * STEP 2: RESOLVE / NORMALIZE ISSUE
   * ============================================================
   */
  const issue =
    municipalityService.resolveIssue(
      municipality,
      {
        issueKey:
          classification.issueKey,

        intent:
          classification.intent,

        keywords:
          classification.keywords,
      }
    );

  logger.info(
    "Issue resolved",
    {
      municipality:
        municipality.slug,

      issueKey:
        issue.issueKey,

      label:
        issue.label,

      source:
        issue.source,
    }
  );

  /*
   * ============================================================
   * STEP 3: MONGODB CACHE LOOKUP
   * ============================================================
   */
  if (!opts.forceRefresh) {
    const cached =
      await getCachedWorkflow(
        municipality._id,
        issue.issueKey
      );

    if (
      cached &&
      cached.status !== "outdated"
    ) {
      logger.info(
        "Workflow cache hit",
        {
          municipality:
            municipality.slug,

          issueKey:
            issue.issueKey,

          workflowId:
            String(cached._id),
        }
      );

      return {
        workflow:
          cached,

        classification,

        fromCache:
          true,
      };
    }

    logger.info(
      "Workflow cache miss",
      {
        municipality:
          municipality.slug,

        issueKey:
          issue.issueKey,
      }
    );
  } else {
    logger.info(
      "Workflow cache bypassed",
      {
        municipality:
          municipality.slug,

        issueKey:
          issue.issueKey,

        reason:
          "forceRefresh",
      }
    );
  }

  /*
   * ============================================================
   * STEP 4: DYNAMIC SOURCE DISCOVERY + WORKFLOW GENERATION
   * ============================================================
   */
  const workflow =
    await buildWorkflowFromScratch(
      municipality,
      issue,
      rawQuery
    );

  logger.info(
    "Workflow generated and cached",
    {
      municipality:
        municipality.slug,

      issueKey:
        issue.issueKey,

      workflowId:
        String(workflow._id),
    }
  );

  return {
    workflow,

    classification,

    fromCache:
      false,
  };
}

/**
 * Builds a workflow from official government sources.
 *
 * IMPORTANT:
 *
 * If the first evidence set is insufficient, the system does NOT
 * immediately fail.
 *
 * It performs additional targeted official-source searches and
 * tries workflow extraction again.
 */
async function buildWorkflowFromScratch(
  municipality,
  issue,
  rawQuery
) {
  /*
   * ============================================================
   * SOURCE COLLECTION HELPER
   * ============================================================
   */
  const sourceDocs = [];
  const processedUrls = new Set();

  async function collectSources(
    searchQuery
  ) {
    logger.info(
      "Searching official government sources",
      {
        municipality:
          municipality.slug,

        issueKey:
          issue.issueKey,

        searchQuery,
      }
    );

    const candidates =
      await searchService.searchGovernmentSources(
        searchQuery,
        municipality.name,
        municipality.allowedDomains
      );

    logger.info(
      "Government source discovery completed",
      {
        municipality:
          municipality.slug,

        issueKey:
          issue.issueKey,

        searchQuery,

        candidateCount:
          candidates.length,
      }
    );

    for (
      const candidate of
        candidates
    ) {
      if (
        !candidate ||
        typeof candidate.url !==
          "string" ||
        !candidate.url.trim()
      ) {
        continue;
      }

      const normalizedUrl =
        candidate.url.trim();

      /*
       * Do not process the same URL twice,
       * even if multiple searches return it.
       */
      if (
        processedUrls.has(
          normalizedUrl
        )
      ) {
        continue;
      }

      processedUrls.add(
        normalizedUrl
      );

      try {
        const domain =
          new URL(
            normalizedUrl
          ).hostname;

        /*
         * First check MongoDB source cache.
         */
        let sourceDoc =
          await getCachedSource(
            municipality._id,
            normalizedUrl
          );

        /*
         * Reuse only a successful, usable
         * source.
         */
        if (
          !sourceDoc ||
          sourceDoc.extractionStatus !==
            "success" ||
          !sourceDoc.quality?.usable
        ) {
          const extracted =
            await extractionService.fetchAndExtract(
              normalizedUrl,
              municipality.allowedDomains
            );

          sourceDoc =
            await Source.findOneAndUpdate(
              {
                municipalityId:
                  municipality._id,

                url:
                  normalizedUrl,
              },

              {
                municipalityId:
                  municipality._id,

                url:
                  normalizedUrl,

                domain,

                documentType:
                  extracted.documentType,

                extractedText:
                  extracted.extractedText,

                contentHash:
                  extracted.contentHash,

                resolvedUrl:
                  extracted.finalUrl,

                retrievalMethod:
                  extracted.retrievalMethod,

                extractionMethod:
                  extracted.extractionMethod,

                pages:
                  extracted.pages,

                chunks:
                  extracted.chunks,

                quality:
                  extracted.quality,

                attemptedUrls:
                  extracted.attemptedUrls,

                fetchedAt:
                  new Date(),

                lastCheckedAt:
                  new Date(),

                extractionStatus:
                  "success",

                extractionError:
                  null,
              },

              {
                upsert:
                  true,

                new:
                  true,
              }
            );
        }

        sourceDocs.push(
          sourceDoc
        );

        logger.info(
          "Usable official source collected",
          {
            url:
              normalizedUrl,

            sourceId:
              String(
                sourceDoc._id
              ),

            extractionMethod:
              sourceDoc.extractionMethod,
          }
        );
      } catch (err) {
        logger.warn(
          "Skipping unusable source",
          {
            url:
              normalizedUrl,

            error:
              err.message,
          }
        );

        /*
         * One bad source must not destroy
         * the entire workflow search.
         */
        continue;
      }
    }
  }

  /*
   * ============================================================
   * STEP 1: FIRST OFFICIAL SEARCH
   * ============================================================
   *
   * Search using:
   *
   * - issue label
   * - original user query
   * - AI-generated keywords
   *
   * This gives the search engine more context.
   */
  const primarySearchQuery =
    [
      issue.label,

      rawQuery,

      ...(Array.isArray(
        issue.keywords
      )
        ? issue.keywords
        : []),
    ]
      .filter(
        (value) =>
          typeof value ===
            "string" &&
          value.trim()
      )
      .join(" ");

  await collectSources(
    primarySearchQuery
  );

  if (
    sourceDocs.length === 0
  ) {
    throw makeError(
      "NO_RELIABLE_SOURCES",
      "No candidate sources found for this issue"
    );
  }

  /*
   * ============================================================
   * RELEVANCE / AI INPUT HELPER
   * ============================================================
   */
  function buildAiInput() {
    const maxChunksPerSource =
      Number(
        process.env
          .MAX_GEMINI_CHUNKS_PER_SOURCE
      ) || 4;

    const issueKeywords =
      Array.isArray(
        issue.keywords
      )
        ? issue.keywords
        : [];

    const rankedSourceChunks =
      sourceDocs.map(
        (source) => {
          const chunks =
            Array.isArray(
              source.chunks
            ) &&
            source.chunks.length
              ? source.chunks
              : [
                  {
                    chunkId:
                      "legacy-1",

                    text:
                      (
                        source.extractedText ||
                        ""
                      ).slice(
                        0,
                        6000
                      ),

                    pageStart:
                      1,

                    pageEnd:
                      1,

                    sectionType:
                      "general_information",

                    sectionPriority:
                      30,
                  },
                ];

          const selectedChunks =
            selectTopChunks(
              chunks,
              rawQuery,
              issueKeywords,
              maxChunksPerSource
            );

          return {
            source,

            chunks:
              selectedChunks,
          };
        }
      );

    const aiInput =
      rankedSourceChunks
        .flatMap(
          ({
            source,
            chunks,
          }) =>
            chunks.map(
              (chunk) => ({
                sourceId:
                  String(
                    source._id
                  ),

                chunkId:
                  chunk.chunkId,

                pageStart:
                  chunk.pageStart,

                pageEnd:
                  chunk.pageEnd,

                sectionType:
                  chunk.sectionType,

                sectionPriority:
                  chunk.sectionPriority,

                relevanceScore:
                  chunk.relevanceScore,

                text:
                  chunk.text,
              })
            )
        )
        .sort(
          (a, b) =>
            (b.relevanceScore || 0) -
            (a.relevanceScore || 0)
        )
        .slice(
          0,
          MAX_TOTAL_GEMINI_CHUNKS
        );

    return {
      aiInput,

      maxChunksPerSource,
    };
  }

  /*
   * ============================================================
   * STEP 2: FIRST EVIDENCE SELECTION
   * ============================================================
   */
  let {
    aiInput,
    maxChunksPerSource,
  } =
    buildAiInput();

  if (
    aiInput.length === 0
  ) {
    throw makeError(
      "NO_RELEVANT_SOURCE_CONTENT",
      "No relevant source content was found for the user's query"
    );
  }

  logger.info(
    "Selected relevant AI chunks",
    {
      query:
        rawQuery,

      issueKey:
        issue.issueKey,

      totalSources:
        sourceDocs.length,

      totalChunksSentToAI:
        aiInput.length,

      maxChunksPerSource,

      maxTotalChunks:
        MAX_TOTAL_GEMINI_CHUNKS,
    }
  );

  console.log(
    "\n===== AI INPUT ====="
  );

  console.dir(
    aiInput,
    {
      depth:
        null,
    }
  );

  console.log(
    "====================\n"
  );

  /*
   * ============================================================
   * STEP 3: FIRST AI WORKFLOW EXTRACTION
   * ============================================================
   */
  let extraction;

  try {
    extraction =
      await aiService.extractWorkflow(
        issue.label,
        aiInput
      );
  } catch (err) {
    /*
     * ==========================================================
     * IMPORTANT RECOVERY PATH
     * ==========================================================
     *
     * If Groq says:
     *
     * GROQ_INSUFFICIENT_EVIDENCE
     *
     * do NOT immediately return HTTP 422.
     *
     * Search official sources again using
     * targeted application/procedure queries.
     */
    if (
      err.message !==
      "GROQ_INSUFFICIENT_EVIDENCE"
    ) {
      throw err;
    }

    logger.warn(
      "AI could not build workflow from first evidence set",
      {
        issueKey:
          issue.issueKey,

        reason:
          "GROQ_INSUFFICIENT_EVIDENCE",

        action:
          "targeted_official_source_search",
      }
    );

    /*
     * ==========================================================
     * STEP 4: TARGETED OFFICIAL SEARCH
     * ==========================================================
     */
    const keywordText =
      Array.isArray(
        issue.keywords
      )
        ? issue.keywords.join(
            " "
          )
        : "";

    const targetedQueries = [
      `${issue.label} application procedure ${municipality.name}`,

      `${issue.label} how to apply documents application form ${municipality.name}`,

      `${issue.label} eligibility procedure required documents ${municipality.name}`,
    ];

    /*
     * Add AI-generated keywords as
     * another targeted search.
     */
    if (
      keywordText.trim()
    ) {
      targetedQueries.push(
        `${keywordText} application procedure ${municipality.name}`
      );
    }

    for (
      const targetedQuery of
        targetedQueries
    ) {
      await collectSources(
        targetedQuery
      );
    }

    /*
     * ==========================================================
     * STEP 5: RE-RANK ALL COLLECTED EVIDENCE
     * ==========================================================
     */
    ({
      aiInput,
      maxChunksPerSource,
    } =
      buildAiInput());

    if (
      aiInput.length === 0
    ) {
      throw makeError(
        "NO_RELEVANT_SOURCE_CONTENT",
        "Official sources were found, but no relevant procedural content could be extracted"
      );
    }

    logger.info(
      "Retrying workflow extraction with targeted evidence",
      {
        issueKey:
          issue.issueKey,

        totalSources:
          sourceDocs.length,

        totalChunksSentToAI:
          aiInput.length,

        maxChunksPerSource,

        maxTotalChunks:
          MAX_TOTAL_GEMINI_CHUNKS,
      }
    );

    console.log(
      "\n===== TARGETED AI INPUT ====="
    );

    console.dir(
      aiInput,
      {
        depth:
          null,
      }
    );

    console.log(
      "==============================\n"
    );

    /*
     * ==========================================================
     * STEP 6: AI WORKFLOW EXTRACTION - RETRY
     * ==========================================================
     */
    extraction =
      await aiService.extractWorkflow(
        issue.label,
        aiInput
      );
  }

  /*
   * ============================================================
   * STEP 7: VALIDATE SOURCE REFERENCES
   * ============================================================
   */
  const validSourceIds =
    new Set(
      sourceDocs.map(
        (source) =>
          String(
            source._id
          )
      )
    );

  /*
   * Map sourceId → actual stored source.
   *
   * AI never controls official URLs.
   */
  const sourceById =
    new Map(
      sourceDocs.map(
        (source) => [
          String(
            source._id
          ),

          source,
        ]
      )
    );

  /*
   * Keep all original chunks so AI evidence can be
   * validated against the complete stored source.
   */
  const chunkById =
    new Map();

  for (
    const source of
      sourceDocs
  ) {
    for (
      const chunk of
        source.chunks || []
    ) {
      chunkById.set(
        `${String(
          source._id
        )}:${chunk.chunkId}`,

        chunk
      );
    }
  }

  /*
   * ============================================================
   * STEP 8: GROUND AI STEPS TO REAL SOURCES
   * ============================================================
   */
  const groundedSteps =
    extraction.steps.map(
      (step) => {
        const sourceIds =
          Array.isArray(
            step.sourceIds
          )
            ? step.sourceIds.map(
                String
              )
            : [];

        /*
         * Keep only source IDs that actually exist.
         */
        const validStepSourceIds =
          sourceIds.filter(
            (sourceId) =>
              validSourceIds.has(
                sourceId
              )
          );

        const evidence =
          (
            Array.isArray(
              step.evidence
            )
              ? step.evidence
              : []
          ).flatMap(
            (item) => {
              const sourceId =
                validStepSourceIds.find(
                  (id) =>
                    chunkById.has(
                      `${id}:${item.chunkId}`
                    )
                );

              if (!sourceId) {
                return [];
              }

              const chunk =
                chunkById.get(
                  `${sourceId}:${item.chunkId}`
                );

              if (!chunk) {
                return [];
              }

              return [
                {
                  chunkId:
                    chunk.chunkId,

                  pageStart:
                    chunk.pageStart ??
                    null,

                  pageEnd:
                    chunk.pageEnd ??
                    null,

                  quote:
                    typeof item.quote ===
                      "string" &&
                    item.quote.length <=
                      600
                      ? item.quote
                      : null,
                },
              ];
            }
          );

        /*
         * Official URL is ALWAYS taken from
         * the stored source.
         */
        const officialUrl =
          validStepSourceIds
            .map(
              (sourceId) =>
                sourceById.get(
                  sourceId
                )?.url
            )
            .find(Boolean) ||
          null;

        return {
          ...step,

          sourceIds:
            validStepSourceIds,

          evidence,

          officialUrl,
        };
      }
    );

  /*
   * ============================================================
   * STEP 9: BUILD CANDIDATE WORKFLOW
   * ============================================================
   */
  const candidateWorkflow = {
    steps:
      groundedSteps,

    conflicts:
      extraction.conflicts,

    missingInformation:
      extraction.missingInformation,
  };

  /*
   * Validate workflow before saving.
   */
  validateWorkflow(
    candidateWorkflow,
    validSourceIds
  );

  /*
   * ============================================================
   * STEP 10: SAVE WORKFLOW TO MONGODB
   * ============================================================
   *
   * Persistent cache:
   *
   * municipalityId + issueKey
   */
  const saved =
    await Workflow.findOneAndUpdate(
      {
        municipalityId:
          municipality._id,

        issueKey:
          issue.issueKey,
      },

      {
        municipalityId:
          municipality._id,

        issueKey:
          issue.issueKey,

        title:
          issue.label,

        steps:
          groundedSteps,

        conflicts:
          extraction.conflicts,

        missingInformation:
          extraction.missingInformation,

        status:
          "needs_review",

        geminiModel:
          process.env.GEMINI_MODEL ||
          null,

        lastRecheckedAt:
          new Date(),
      },

      {
        upsert:
          true,

        new:
          true,
      }
    );

  logger.info(
    "Workflow saved to MongoDB cache",
    {
      municipality:
        municipality.slug,

      issueKey:
        issue.issueKey,

      workflowId:
        String(
          saved._id
        ),
    }
  );

  return saved;
}

/**
 * Marks a workflow as verified.
 */
async function markWorkflowVerified(
  workflowId,
  verifiedBy
) {
  const workflow =
    await Workflow.findById(
      workflowId
    );

  if (!workflow) {
    throw makeError(
      "NOT_FOUND",
      "Workflow not found"
    );
  }

  workflow.status =
    "verified";

  workflow.verifiedBy =
    verifiedBy;

  workflow.verifiedAt =
    new Date();

  await workflow.save();

  return workflow;
}

/**
 * Converts a workflow document into
 * the graph-ready shape expected by React Flow.
 */
function toGraphJson(
  workflow
) {
  return {
    id:
      String(
        workflow._id
      ),

    title:
      workflow.title,

    status:
      workflow.status,

    nodes:
      workflow.steps.map(
        (s) => ({
          id:
            s.stepId,

          label:
            s.title,

          data: {
            description:
              s.description,

            fee:
              s.fee,

            deadline:
              s.deadline,

            documentsRequired:
              s.documentsRequired,

            eligibility:
              s.eligibility,

            office:
              s.office,

            officialUrl:
              s.officialUrl,

            sourceIds:
              s.sourceIds,

            isUncertain:
              s.isUncertain,

            uncertaintyNote:
              s.uncertaintyNote,

            evidence:
              s.evidence,
          },
        })
      ),

    edges:
      workflow.steps.flatMap(
        (s) =>
          (
            s.dependsOn ||
            []
          ).map(
            (dep) => ({
              from:
                dep,

              to:
                s.stepId,
            })
          )
      ),

    conflicts:
      workflow.conflicts,

    missingInformation:
      workflow.missingInformation,
  };
}

module.exports = {
  resolveWorkflowForQuery,
  buildWorkflowFromScratch,
  getCachedWorkflow,
  markWorkflowVerified,
  toGraphJson,
};