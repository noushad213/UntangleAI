const mongoose = require("mongoose");
const Workflow = require("../models/Workflow");
const Source = require("../models/Source");
const { makeError } = require("../utils/errors");
const {
  validateWorkflow,
  quoteMatchesText,
  groundStepFacts,
} = require("../validators/workflow.validator");

const municipalityService = require("./municipality.service");
const aiService = require("./ai.service");
const queryRouterService = require("./queryRouter.service");
const searchService = require("./search.service");
const { buildSourcePlan, classifyTradeQuery, findUncoveredTradeTasks } = require("./source-policy");
const extractionService = require("./extraction.service");
const {
  selectTopChunks,
} = require("./relevance.service");

const logger = require("../utils/logger");
const { recoverWorkflowDetails, needsDetailsRecovery } = require("./workflow-details-recovery");
const { evaluateQueryGuardrail } = require("../utils/civic-query-guardrail");

const MAX_TOTAL_GEMINI_CHUNKS = 10;
const MAX_EVIDENCE_CHARS_PER_CHUNK = 1800;
const MAX_LIVE_SEARCHES_PER_WORKFLOW = 5;
const DEFAULT_WORKFLOW_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;

function getMaxSourcesPerWorkflow(env = process.env) {
  const configured = Number(env.MAX_SOURCES_PER_WORKFLOW);
  if (!Number.isInteger(configured) || configured < 1) return 8;
  return Math.min(configured, 10);
}

function matchCatalogIssue(query, issueCatalog = []) {
  if (typeof query !== "string" || !Array.isArray(issueCatalog)) return null;

  const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!normalizedQuery) return null;

  const match = issueCatalog.find((issue) => {
    const phrases = [issue.label, ...(Array.isArray(issue.keywords) ? issue.keywords : [])]
      .filter((value) => typeof value === "string")
      .map((value) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim())
      .filter((value) => value.length >= 4);

    return phrases.some((phrase) => normalizedQuery.includes(phrase));
  });

  if (!match) return null;

  return {
    issueKey: match.issueKey,
    intent: match.label,
    keywords: Array.isArray(match.keywords) ? match.keywords : [],
    confidence: 1,
    classifier: "catalog",
  };
}

function isWorkflowFresh(
  workflow,
  freshnessMs = Number(process.env.WORKFLOW_FRESHNESS_MS) || DEFAULT_WORKFLOW_FRESHNESS_MS,
  now = new Date()
) {
  const checkedAt = workflow?.lastRecheckedAt || workflow?.updatedAt;
  if (!checkedAt) return false;
  const checkedTime = new Date(checkedAt).getTime();
  return Number.isFinite(checkedTime) && now.getTime() - checkedTime <= freshnessMs;
}

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
 * Finds pre-ingested local sources for a civic issue in MongoDB.
 * Looks for sources tagged with issueKey for the municipality, or state-wide sources.
 */
async function getLocalSourcesForIssue(
  municipalityId,
  issueKey
) {
  if (
    !issueKey ||
    !mongoose.connection ||
    mongoose.connection.readyState !== 1 ||
    typeof Source.find !== "function"
  ) {
    return [];
  }

  try {
    let sources = await Source.find({
      municipalityId,
      issueKeys: issueKey,
      extractionStatus: "success",
      "quality.usable": true,
    })
      .sort({ "quality.score": -1, updatedAt: -1 })
      .limit(10);

    if (sources.length < 5 && Source.find) {
      const stateSources = await Source.find({
        issueKeys: issueKey,
        extractionStatus: "success",
        "quality.usable": true,
        _id: { $nin: sources.map((s) => s._id) },
      })
        .sort({ "quality.score": -1, updatedAt: -1 })
        .limit(5);

      if (Array.isArray(stateSources) && stateSources.length > 0) {
        sources = [...sources, ...stateSources];
      }
    }

    return Array.isArray(sources) ? sources : [];
  } catch (err) {
    logger.warn("Could not query local pre-ingested sources", { error: err.message });
    return [];
  }
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

  const guardrailCheck = evaluateQueryGuardrail(rawQuery);
  if (guardrailCheck.type !== "VALID") {
    throw makeError(
      guardrailCheck.code,
      guardrailCheck.message,
      { suggestions: guardrailCheck.suggestions }
    );
  }

  /*
   * ============================================================
   * STEP 1: UNDERSTAND THE USER'S ISSUE
   * ============================================================
   *
   * The catalog is optional context only.
   * New civic issues are allowed.
   */
  let classification = classifyTradeQuery(rawQuery) || matchCatalogIssue(rawQuery, municipality.issueCatalog || []);

  if (!classification) {
    classification = await queryRouterService.matchCivicQuery(rawQuery, municipality.slug);
  }

  if (!classification) {
    classification = await aiService.classifyIntent(
      rawQuery,
      municipality.name,
      municipality.issueCatalog || []
    );

    if (classification && classification.confidence >= 0.8 && classification.issueKey) {
      queryRouterService.recordLearnedQuery({
        queryText: rawQuery,
        issueKey: classification.issueKey,
        intentLabel: classification.intent,
        municipalitySlug: municipality.slug,
        keywords: Array.isArray(classification.keywords) ? classification.keywords : [],
      });
    }
  }

  logger.info(
    "Civic issue classified",
    {
      municipality:
        municipality.slug,

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
      cached.status !== "outdated" &&
      isWorkflowFresh(cached) && !needsDetailsRecovery(cached)
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

    if (cached && cached.status !== "outdated") {
      cached.status = "outdated";
      await cached.save();
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
  const maxSources = getMaxSourcesPerWorkflow();
  const sourcePlan = buildSourcePlan(rawQuery, municipality);
  let liveSearches = 0;

  async function processCandidateUrl(normalizedUrl) {
    const domain = new URL(normalizedUrl).hostname;
    let sourceDoc = await getCachedSource(municipality._id, normalizedUrl);

    if (
      !sourceDoc ||
      sourceDoc.extractionStatus !== "success" ||
      !sourceDoc.quality?.usable
    ) {
      const extracted = await extractionService.fetchAndExtract(
        normalizedUrl,
        sourcePlan.allowedDomains
      );

      sourceDoc = await Source.findOneAndUpdate(
        {
          municipalityId: municipality._id,
          url: normalizedUrl,
        },
        {
          municipalityId: municipality._id,
          url: normalizedUrl,
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
          $addToSet: { issueKeys: issue.issueKey },
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
    } else if (
      sourceDoc &&
      !sourceDoc.issueKeys?.includes(issue.issueKey) &&
      mongoose.connection?.readyState === 1 &&
      typeof Source.updateOne === "function"
    ) {
      Source.updateOne(
        { _id: sourceDoc._id },
        { $addToSet: { issueKeys: issue.issueKey } }
      ).catch(() => {});
    }

    if (sourceDoc?.extractionStatus === "success" && sourceDoc?.quality?.usable) {
      return sourceDoc;
    }
    return null;
  }

  async function collectSources(
    searchQuery,
    sourceLimit = maxSources,
    searchScope = {}
  ) {
    if (sourceDocs.length >= sourceLimit || liveSearches >= MAX_LIVE_SEARCHES_PER_WORKFLOW) return;
    liveSearches++;

    logger.info(
      "Searching official government sources",
      {
        municipality: municipality.slug,
        issueKey: issue.issueKey,
      }
    );

    const candidates =
      await searchService.searchGovernmentSources(
        searchQuery,
        municipality.name,
        searchScope.allowedDomains || sourcePlan.allowedDomains,
        { jurisdiction: searchScope.jurisdiction || (sourcePlan.searches.length ? 'national' : 'local') }
      );

    logger.info(
      "Government source discovery completed",
      {
        municipality: municipality.slug,
        issueKey: issue.issueKey,
        candidateCount: candidates.length,
      }
    );

    const validUrls = [];
    for (const candidate of candidates) {
      if (!candidate || typeof candidate.url !== "string" || !candidate.url.trim()) {
        continue;
      }

      const normalizedUrl = candidate.url.trim();
      if (processedUrls.has(normalizedUrl)) {
        continue;
      }

      try {
        new URL(normalizedUrl);
      } catch {
        continue;
      }

      processedUrls.add(normalizedUrl);
      validUrls.push(normalizedUrl);
    }

    if (validUrls.length === 0) return;

    const CONCURRENCY = 3;
    let nextCandidateIndex = 0;
    let inFlight = 0;
    let uncommittedUsable = 0;
    const completedResults = new Map();
    let nextCommitIndex = 0;

    return new Promise((resolve) => {
      function commitInOrder() {
        while (completedResults.has(nextCommitIndex)) {
          const doc = completedResults.get(nextCommitIndex);
          completedResults.delete(nextCommitIndex);
          nextCommitIndex++;

          if (doc) {
            uncommittedUsable--;
            if (sourceDocs.length < sourceLimit) {
              sourceDocs.push(doc);
              logger.info("Usable official source collected", {
                url: doc.url,
                sourceId: String(doc._id),
                extractionMethod: doc.extractionMethod,
              });
            }
          }
        }
      }

      function pump() {
        commitInOrder();

        if (sourceDocs.length >= sourceLimit) {
          return resolve();
        }

        while (
          inFlight < CONCURRENCY &&
          nextCandidateIndex < validUrls.length &&
          sourceDocs.length + uncommittedUsable + inFlight < sourceLimit
        ) {
          const currentIndex = nextCandidateIndex++;
          const url = validUrls[currentIndex];
          inFlight++;

          processCandidateUrl(url)
            .then((doc) => {
              inFlight--;
              if (doc) {
                uncommittedUsable++;
              }
              completedResults.set(currentIndex, doc);
              pump();
            })
            .catch((err) => {
              inFlight--;
              logger.warn("Skipping unusable source", {
                url,
                error: err.message,
              });
              completedResults.set(currentIndex, null);
              pump();
            });
        }

        if (
          inFlight === 0 &&
          (nextCandidateIndex >= validUrls.length ||
            sourceDocs.length + uncommittedUsable >= sourceLimit)
        ) {
          commitInOrder();
          resolve();
        }
      }

      pump();
    });
  }

  /*
   * ============================================================
   * STEP 1: LOCAL PRE-INGESTED KNOWLEDGE BASE LOOKUP (TIER 2)
   * ============================================================
   * Fast path: check MongoDB for pre-scraped, verified sources
   * tagged with this issueKey before reaching out to live websites.
   */
  const localSources = await getLocalSourcesForIssue(
    municipality._id,
    issue.issueKey
  );

  if (Array.isArray(localSources) && localSources.length > 0) {
    logger.info("Local pre-ingested sources found for civic issue", {
      municipality: municipality.slug,
      issueKey: issue.issueKey,
      count: localSources.length,
    });

    for (const doc of localSources) {
      if (sourceDocs.length >= maxSources) break;
      if (!processedUrls.has(doc.url)) {
        processedUrls.add(doc.url);
        sourceDocs.push(doc);
      }
    }
  }

  /*
   * ============================================================
   * STEP 2: JUST-IN-TIME OFFICIAL LIVE SEARCH (TIER 3 FALLBACK)
   * ============================================================
   * Executed when local pre-ingested knowledge is absent or insufficient.
   */
  if (sourcePlan.searches.length) {
    // Reserve evidence slots for each authority instead of filling them with one topic.
    for (const scope of sourcePlan.searches) {
      await collectSources(scope.query, Math.min(maxSources, sourceDocs.length + 1), scope);
    }
  }

  if (sourceDocs.length === 0) {
    const primarySearchQuery =
      [
        issue.label,
        rawQuery,
        ...(Array.isArray(issue.keywords) ? issue.keywords : []),
      ]
        .filter((value) => typeof value === "string" && value.trim())
        .join(" ");

    await collectSources(primarySearchQuery);

    if (sourceDocs.length === 0) {
      const recoveryQueries = [
        `${issue.label} application form required documents ${sourcePlan.searches.length ? 'India' : municipality.name}`,
        `${issue.label} license permit procedure ${sourcePlan.searches.length ? 'India' : municipality.name}`,
      ];
      for (const recoveryQuery of recoveryQueries) {
        await collectSources(recoveryQuery);
        if (sourceDocs.length > 0) break;
      }
    }
  }

  if (
    sourceDocs.length === 0
  ) {
    throw makeError(
      "NO_RELIABLE_SOURCES",
      "No readable official sources could be collected after targeted searches"
    );
  }

  /*
   * ============================================================
   * RELEVANCE / AI INPUT HELPER
   * ============================================================
   */
  function buildAiInput(rankingQuery = rawQuery) {
    const maxChunksPerSource =
      Number(
        process.env
          .MAX_GEMINI_CHUNKS_PER_SOURCE
      ) || 3;

    const issueKeywords = [
      ...(Array.isArray(issue.keywords) ? issue.keywords : []),
      ...(sourcePlan.keywords || []),
    ];

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
              rankingQuery,
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

    let aiInput =
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
                  String(chunk.text || '').slice(0, MAX_EVIDENCE_CHARS_PER_CHUNK),
              })
            )
        )
        .sort(
          (a, b) =>
            (b.relevanceScore || 0) -
            (a.relevanceScore || 0)
        );

    if (sourcePlan.searches.length) {
      const represented = new Set();
      const firstPerSource = aiInput.filter((chunk) => {
        if (represented.has(chunk.sourceId)) return false;
        represented.add(chunk.sourceId);
        return true;
      });
      const selected = new Set(firstPerSource);
      aiInput = [...firstPerSource, ...aiInput.filter((chunk) => !selected.has(chunk))];
    }
    aiInput = aiInput.slice(0, MAX_TOTAL_GEMINI_CHUNKS);

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

    const searchLocation = sourcePlan.searches.length ? 'India' : municipality.name;
    const targetedQueries = [
      `${issue.label} application procedure ${searchLocation}`,

      `${issue.label} how to apply documents application form ${searchLocation}`,

      `${issue.label} eligibility procedure required documents ${searchLocation}`,
    ];

    /*
     * Add AI-generated keywords as
     * another targeted search.
     */
    if (
      keywordText.trim()
    ) {
      targetedQueries.push(
        `${keywordText} application procedure ${searchLocation}`
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
  extraction = await recoverWorkflowDetails(extraction, {
    issueLabel: issue.label,
    cityName: sourcePlan.searches.length ? 'India' : municipality.name,
    collectSources: (query) => collectSources(query, Math.min(maxSources + 2, 10)),
    reextract: (gaps) => aiService.extractWorkflow(
      `${issue.label}. Resolve these source gaps while preserving step IDs and existing facts: ${gaps.join('; ')}. Existing workflow: ${JSON.stringify(extraction)}`,
      buildAiInput([rawQuery, ...gaps].join(' ')).aiInput
    ),
    validate: (candidate) => {
      validateWorkflow(candidate, new Set(sourceDocs.map((source) => String(source._id))));
      for (const step of candidate.steps) {
        for (const evidence of step.evidence || []) {
          if (!evidence.quote) continue;
          const grounded = sourceDocs.some((source) => (step.sourceIds || []).map(String).includes(String(source._id))
            && (source.chunks?.length ? source.chunks : [{ chunkId: 'legacy-1', text: String(source.extractedText || '').slice(0, 6000) }]).some((chunk) => chunk.chunkId === evidence.chunkId
              && quoteMatchesText(chunk.text, evidence.quote)));
          if (!grounded) throw makeError('VALIDATION_FAILED', 'Recovery evidence does not match the official source text');
        }
      }
    },
    onRecovered: (result) => logger.info('Additional official evidence filled roadmap details', { issueKey: issue.issueKey, ...result }),
    onFailure: (error) => logger.warn('Keeping original roadmap after details recovery failed', { issueKey: issue.issueKey, error: error.message }),
  });

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

              const quote =
                typeof item.quote === "string" &&
                item.quote.length <= 600 &&
                quoteMatchesText(chunk.text, item.quote)
                  ? item.quote
                  : null;

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

                  quote,
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

        return groundStepFacts({
          ...step,

          sourceIds:
            validStepSourceIds,

          evidence,

          officialUrl,
        });
      }
    );

  /*
   * ============================================================
   * STEP 9: BUILD CANDIDATE WORKFLOW
   * ============================================================
   */
  extraction.missingInformation = [...new Set([
    ...(extraction.missingInformation || []),
    ...findUncoveredTradeTasks(rawQuery, groundedSteps),
  ])];
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

        detailsRecoveryAttempted: true,

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

  assertWorkflowIntentCoverage(workflow);

  workflow.status =
    "verified";

  workflow.verifiedBy =
    verifiedBy;

  workflow.verifiedAt =
    new Date();

  await workflow.save();

  return workflow;
}

function assertWorkflowIntentCoverage(workflow) {
  const uncoveredTradeTasks = findUncoveredTradeTasks(workflow?.title, workflow?.steps || []);
  if (uncoveredTradeTasks.length > 0) {
    throw makeError(
      "VALIDATION_FAILED",
      "This roadmap still has unresolved resale requirements and cannot be marked verified.",
      uncoveredTradeTasks
    );
  }
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

    municipalityId:
      String(workflow.municipalityId),

    issueKey:
      workflow.issueKey,

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
              (s.sourceIds || []).map((sourceId) => String(sourceId)),

            isUncertain:
              s.isUncertain,

            uncertaintyNote:
              s.uncertaintyNote,

            evidence:
              s.evidence,

            stepType:
              s.stepType || null,

            nodeType:
              s.stepType || null,
          },
        })
      ),

    edges: (() => {
      const explicitEdges = (workflow.steps || []).flatMap((s) =>
        (s.dependsOn || []).map((dep) => ({
          from: dep,
          to: s.stepId,
        }))
      );
      if (explicitEdges.length > 0) return explicitEdges;
      return (workflow.steps || []).slice(0, -1).map((s, idx) => ({
        from: s.stepId,
        to: workflow.steps[idx + 1].stepId,
      }));
    })(),

    conflicts:
      workflow.conflicts,

    missingInformation:
      workflow.status === 'verified' ? workflow.missingInformation : [...new Set([
        ...(workflow.missingInformation || []),
        ...findUncoveredTradeTasks(workflow.title, workflow.steps),
      ])],

    verifiedBy:
      workflow.verifiedBy || null,

    verifiedAt:
      workflow.verifiedAt ? new Date(workflow.verifiedAt).toISOString() : null,

    lastRecheckedAt:
      workflow.lastRecheckedAt ? new Date(workflow.lastRecheckedAt).toISOString() : null,

    updatedAt:
      workflow.updatedAt ? new Date(workflow.updatedAt).toISOString() : null,
  };
}

module.exports = {
  resolveWorkflowForQuery,
  buildWorkflowFromScratch,
  getCachedWorkflow,
  markWorkflowVerified,
  assertWorkflowIntentCoverage,
  toGraphJson,
  isWorkflowFresh,
  getMaxSourcesPerWorkflow,
  matchCatalogIssue,
};
