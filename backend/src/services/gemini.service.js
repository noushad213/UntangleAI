const { GoogleGenAI } = require("@google/genai");
const { makeError } = require("../utils/errors");
const logger = require("../utils/logger");

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw makeError(
        "GEMINI_FAILED",
        "GEMINI_API_KEY is not configured"
      );
    }

    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return client;
}

const MODEL =
  process.env.GEMINI_MODEL || "gemini-3.8-flash";

/**
 * Strips markdown code fences and parses JSON.
 */
function parseJsonResponse(text) {
  const cleaned = String(text || "")
    .replace(/```json|```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    logger.warn("Gemini returned non-JSON output", {
      length: String(text || "").length,
    });

    throw makeError(
      "GEMINI_INVALID_OUTPUT",
      "Model did not return valid JSON",
      {
        raw: cleaned.slice(0, 500),
      }
    );
  }
}

/**
 * Determines whether a Gemini error is safe to retry.
 */
function getRetryDecision(errorMessage) {
  const message = String(errorMessage || "");

  const quotaExceeded =
    /quota exceeded|quotaexceeded|RESOURCE_EXHAUSTED|free_tier_requests|GenerateRequestsPerDayPerProject/i.test(
      message
    );

  if (quotaExceeded) {
    return {
      retry: false,
      reason: "quota_exceeded",
    };
  }

  if (/429|rate limit|too many requests/i.test(message)) {
    return {
      retry: true,
      reason: "rate_limited",
    };
  }

  if (/500|502|503|504|high demand|UNAVAILABLE/i.test(message)) {
    return {
      retry: true,
      reason: "temporary_server_error",
    };
  }

  if (
    /timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND/i.test(
      message
    )
  ) {
    return {
      retry: true,
      reason: "network_error",
    };
  }

  return {
    retry: false,
    reason: "permanent_error",
  };
}

/**
 * Extracts retry delay from Gemini error response.
 */
function getRetryDelay(errorMessage, attempt) {
  const message = String(errorMessage || "");

  const secondsMatch = message.match(
    /retry(?: in| after)\s+([\d.]+)\s*s/i
  );

  if (secondsMatch) {
    const seconds = Number(secondsMatch[1]);

    if (Number.isFinite(seconds)) {
      return Math.min(
        Math.ceil(seconds * 1000) + 500,
        30000
      );
    }
  }

  return 1000 * 2 ** attempt;
}

/**
 * Calls Gemini with retries for temporary errors.
 */
async function callGemini(
  systemInstruction,
  userContent,
  { retries = 3 } = {}
) {
  const ai = getClient();

  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      logger.info("Calling Gemini", {
        model: MODEL,
        attempt: attempt + 1,
        maxAttempts: retries + 1,
      });

      const response =
        await ai.models.generateContent({
          model: MODEL,

          contents: [
            {
              role: "user",
              parts: [
                {
                  text: userContent,
                },
              ],
            },
          ],

          config: {
            systemInstruction,
            responseMimeType: "application/json",
          },
        });

      const text =
        response.text ??
        response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      logger.info("Gemini request successful", {
        model: MODEL,
        attempt: attempt + 1,
      });

      return text;
    } catch (err) {
      lastErr = err;

      const errorMessage =
        err?.message || String(err);

      const decision =
        getRetryDecision(errorMessage);

      logger.warn(
        "Gemini request attempt failed",
        {
          model: MODEL,
          attempt: attempt + 1,
          error: errorMessage,
          retry: decision.retry,
          reason: decision.reason,
        }
      );

      if (
        !decision.retry ||
        attempt === retries
      ) {
        break;
      }

      const delay = getRetryDelay(
        errorMessage,
        attempt
      );

      logger.info(
        "Retrying Gemini request",
        {
          retryInMs: delay,
          nextAttempt: attempt + 2,
          reason: decision.reason,
        }
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }

  logger.error("Gemini call failed", {
    model: MODEL,
    error:
      lastErr?.message ||
      String(lastErr),
  });

  throw makeError(
    "GEMINI_FAILED",
    "Gemini request failed",
    {
      message:
        lastErr?.message ||
        String(lastErr),
    }
  );
}

/**
 * Understands a natural-language civic query.
 *
 * IMPORTANT:
 * The issue catalog is optional context only.
 * It is NOT a restriction.
 *
 * The model may identify a completely new civic issue
 * that does not exist in the municipality issue catalog.
 */
async function classifyIntent(
  query,
  municipalityName,
  issueCatalog = []
) {
  const system = [
    "You are a civic-service intent classifier.",

    "Understand the user's natural-language civic request for the specified municipality.",

    "The user may ask about ANY civic issue or government service.",

    "Do NOT restrict the answer to a predefined catalog.",

    "The issue catalog, if supplied, is only optional context for recognizing common known issues.",

    "If the requested issue is not present in the catalog, create a new normalized issue representation.",

    "Return ONLY valid JSON.",

    "Return exactly this structure:",
    '{"issueKey":"string","intent":"string","keywords":["string"],"confidence":0}',

    "issueKey must be a short, stable, lowercase kebab-case identifier describing the civic issue.",

    "Examples of valid issueKey values:",
    "dog-license",
    "property-tax-payment",
    "birth-certificate",
    "water-connection",
    "building-permission",
    "marriage-certificate",

    "Do not include municipality names in issueKey.",

    "Do not include dates, personal names, addresses, or temporary details in issueKey.",

    "Use the core civic service or issue as the issueKey.",

    "intent should be a concise human-readable name for the requested civic service.",

    "keywords should contain useful search terms related to the issue.",

    "confidence must be a number between 0 and 1.",

    "If the query is clearly a civic-service request, provide the best issue representation even when the issue is not in the catalog.",

    "Only use a very low confidence when the query is genuinely ambiguous or is not a civic-service request.",

    "Do not explain your answer.",
  ].join(" ");

  const user = JSON.stringify({
    municipality: municipalityName,
    query,

    optionalIssueCatalog:
      Array.isArray(issueCatalog)
        ? issueCatalog.map((item) => ({
            issueKey: item.issueKey,
            label: item.label,
            keywords: item.keywords,
          }))
        : [],
  });

  const text = await callGemini(
    system,
    user
  );

  const parsed =
    parseJsonResponse(text);

  if (
    typeof parsed.issueKey !== "string" ||
    !parsed.issueKey.trim() ||
    typeof parsed.intent !== "string" ||
    !parsed.intent.trim() ||
    !Array.isArray(parsed.keywords) ||
    typeof parsed.confidence !== "number"
  ) {
    throw makeError(
      "GEMINI_INVALID_OUTPUT",
      "classifyIntent response missing required fields"
    );
  }

  return {
    issueKey: parsed.issueKey
      .trim()
      .toLowerCase(),

    intent: parsed.intent.trim(),

    keywords: parsed.keywords
      .filter(
        (keyword) =>
          typeof keyword === "string" &&
          keyword.trim()
      )
      .map((keyword) => keyword.trim()),

    confidence: Math.max(
      0,
      Math.min(1, parsed.confidence)
    ),
  };
}

/**
 * Extracts a source-grounded workflow from official source text.
 *
 * IMPORTANT:
 * Gemini does NOT generate or verify official URLs.
 * The backend is responsible for resolving URLs from source records.
 */
async function extractWorkflow(
  issueLabel,
  sources
) {
  const system = [
    "You extract a step-by-step civic procedure ONLY from the supplied official source text.",
    "Cover each distinct part of the requested task. If a part has no supporting source, identify it in missingInformation instead of silently omitting it. Registration topics in the sources are not automatically obligations for this applicant; preserve eligibility conditions.",

    "You must never fabricate fees, deadlines, documents, eligibility, offices, or URLs.",

    "If a fact is not explicitly present in the sources, use null for that field and add a note to missingInformation.",

    "Every step that states a concrete fact must include the sourceId(s) it came from in sourceIds.",

    "When a fact comes from a supplied chunk, include an evidence entry with its exact chunkId, pageStart, pageEnd, and a short verbatim quote.",

    "Do not invent anchors, quotes, sourceIds, chunkIds, page numbers, or evidence.",

    "IMPORTANT URL RULE: Never generate, guess, reconstruct, modify, shorten, or invent a URL.",

    "Do not create a URL from a website name, page title, service name, or your own knowledge.",

    "Do not transform a PDF URL into a webpage URL.",

    "Do not transform a webpage URL into a different URL.",

    "Do not return a URL based on what you believe the official website should be.",

    "officialUrl must ALWAYS be null in the model response.",

    "The backend will assign officialUrl using the original URL stored in the corresponding source record.",

    "Use sourceIds to identify which supplied sources support each step.",

    "The backend will use those sourceIds to resolve the real URL.",

    "If no source supports a URL, do not provide one.",

    "If sources disagree, add an entry to conflicts describing the disagreement and the sourceIds involved.",

    'Respond with ONLY JSON matching: {"steps":[{"stepId":string,"title":string,"description":string,"dependsOn":string[],"sourceIds":string[],"evidence":[{"chunkId":string,"pageStart":number|null,"pageEnd":number|null,"quote":string|null}],"fee":string|null,"deadline":string|null,"documentsRequired":string[],"eligibility":string|null,"office":string|null,"officialUrl":null,"isUncertain":boolean,"uncertaintyNote":string|null}],"conflicts":[{"description":string,"sourceIds":string[]}],"missingInformation":string[]}',
  ].join(" ");

  const user = JSON.stringify({
    issue: issueLabel,
    sources,
  });

  const text = await callGemini(
    system,
    user,
    {
      retries: 3,
    }
  );

  const parsed =
    parseJsonResponse(text);

  if (!Array.isArray(parsed.steps)) {
    throw makeError(
      "GEMINI_INVALID_OUTPUT",
      "extractWorkflow response missing steps array"
    );
  }

  return {
    steps: parsed.steps,

    conflicts:
      Array.isArray(parsed.conflicts)
        ? parsed.conflicts
        : [],

    missingInformation:
      Array.isArray(
        parsed.missingInformation
      )
        ? parsed.missingInformation
        : [],
  };
}

module.exports = {
  classifyIntent,
  extractWorkflow,
  MODEL,
};
