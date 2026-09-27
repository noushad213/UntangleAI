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
  process.env.GEMINI_MODEL || "gemini-2.0-flash";

/**
 * Strips markdown code fences and parses JSON.
 */
function parseJsonResponse(text) {
  const cleaned = text
    .replace(/```json|```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    logger.warn("Gemini returned non-JSON output", {
      length: text.length,
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
 *
 * Important:
 * - 503 = temporary service overload → retry
 * - 500/502/504 = temporary server/network issue → retry
 * - timeout/network reset → retry
 * - 429 caused by quota exhaustion → DO NOT retry
 * - 429 caused by temporary rate limiting → retry
 */
function getRetryDecision(errorMessage) {
  const message = String(errorMessage || "");

  // Gemini free-tier/project quota exhaustion.
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

  // Temporary rate limiting.
  if (/429|rate limit|too many requests/i.test(message)) {
    return {
      retry: true,
      reason: "rate_limited",
    };
  }

  // Temporary server/service errors.
  if (/500|502|503|504|high demand|UNAVAILABLE/i.test(message)) {
    return {
      retry: true,
      reason: "temporary_server_error",
    };
  }

  // Temporary network errors.
  if (/timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND/i.test(message)) {
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
 * Extracts retry delay from Gemini error response when available.
 */
function getRetryDelay(errorMessage, attempt) {
  const message = String(errorMessage || "");

  // Example:
  // "Please retry in 4.046234588s."
  const secondsMatch = message.match(
    /retry(?: in| after)\s+([\d.]+)\s*s/i
  );

  if (secondsMatch) {
    const seconds = Number(secondsMatch[1]);

    if (Number.isFinite(seconds)) {
      // Add a small buffer.
      return Math.min(
        Math.ceil(seconds * 1000) + 500,
        30000
      );
    }
  }

  // Default exponential backoff:
  // attempt 1 → 1s
  // attempt 2 → 2s
  // attempt 3 → 4s
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

      const response = await ai.models.generateContent({
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

      // Don't retry quota exhaustion or permanent errors.
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
 * Classifies a natural-language query into a known issue.
 */
async function classifyIntent(
  query,
  municipalityName,
  issueCatalog
) {
  const system = [
    "You classify a citizen's civic request into one issue from a fixed catalog.",
    "Respond with ONLY a JSON object: {\"issueKey\":string|null,\"intent\":string,\"keywords\":string[],\"confidence\":number between 0 and 1}.",
    "issueKey must be one of the catalog's issueKey values, or null if nothing matches well.",
    "Do not explain.",
    "Do not invent an issueKey not in the catalog.",
  ].join(" ");

  const user = JSON.stringify({
    municipality: municipalityName,
    query,
    issueCatalog: issueCatalog.map((i) => ({
      issueKey: i.issueKey,
      label: i.label,
      keywords: i.keywords,
    })),
  });

  const text = await callGemini(
    system,
    user
  );

  const parsed =
    parseJsonResponse(text);

  if (
    typeof parsed.confidence !== "number" ||
    !Array.isArray(parsed.keywords)
  ) {
    throw makeError(
      "GEMINI_INVALID_OUTPUT",
      "classifyIntent response missing required fields"
    );
  }

  return parsed;
}

/**
 * Extracts a source-grounded workflow from official source text.
 */
async function extractWorkflow(
  issueLabel,
  sources
) {
  const system = [
    "You extract a step-by-step civic procedure ONLY from the supplied official source text.",

    "You must never fabricate fees, deadlines, documents, eligibility, offices, or URLs.",

    "If a fact is not explicitly present in the sources, use null for that field and add a note to missingInformation.",

    "Every step that states a concrete fact must include the sourceId(s) it came from in sourceIds.",

    "When a fact comes from a supplied chunk, include an evidence entry with its exact chunkId, pageStart, pageEnd, and a short verbatim quote.",

    "Do not invent anchors or quotes.",

    "officialUrl must always be null; the backend owns official URLs and will add them from source records.",

    "If sources disagree, add an entry to conflicts describing the disagreement and the sourceIds involved.",

    "Respond with ONLY JSON matching: {\"steps\":[{\"stepId\":string,\"title\":string,\"description\":string,\"dependsOn\":string[],\"sourceIds\":string[],\"evidence\":[{\"chunkId\":string,\"pageStart\":number|null,\"pageEnd\":number|null,\"quote\":string|null}],\"fee\":string|null,\"deadline\":string|null,\"documentsRequired\":string[],\"eligibility\":string|null,\"office\":string|null,\"officialUrl\":string|null,\"isUncertain\":boolean,\"uncertaintyNote\":string|null}],\"conflicts\":[{\"description\":string,\"sourceIds\":string[]}],\"missingInformation\":string[]}"
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