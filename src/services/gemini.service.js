const { GoogleGenAI } = require("@google/genai");
const { makeError } = require("../utils/errors");
const logger = require("../utils/logger");

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw makeError("GEMINI_FAILED", "GEMINI_API_KEY is not configured");
    }
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

/** Strips ``` fences etc. and parses JSON, throwing GEMINI_INVALID_OUTPUT on failure. */
function parseJsonResponse(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    logger.warn("Gemini returned non-JSON output", { length: text.length });
    throw makeError("GEMINI_INVALID_OUTPUT", "Model did not return valid JSON", {
      raw: cleaned.slice(0, 500),
    });
  }
}

async function callGemini(systemInstruction, userContent, { retries = 1 } = {}) {
  const ai = getClient();
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });
      const text = response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini");
      return text;
    } catch (err) {
      lastErr = err;
      const transient = /timeout|ECONNRESET|429|503/i.test(err.message || "");
      if (!transient || attempt === retries) break;
      await new Promise((r) => setTimeout(r, 300 * 2 ** attempt)); // exponential backoff
    }
  }
  logger.error("Gemini call failed", { error: lastErr.message });
  throw makeError("GEMINI_FAILED", "Gemini request failed", { message: lastErr.message });
}

/**
 * Classifies a natural-language query into a known issue.
 * @param {string} query
 * @param {string} municipalityName
 * @param {Array<{issueKey:string,label:string,keywords:string[]}>} issueCatalog
 * @returns {Promise<{issueKey:string, intent:string, keywords:string[], confidence:number}>}
 */
async function classifyIntent(query, municipalityName, issueCatalog) {
  const system = [
    "You classify a citizen's civic request into one issue from a fixed catalog.",
    "Respond with ONLY a JSON object: {\"issueKey\":string|null,\"intent\":string,\"keywords\":string[],\"confidence\":number between 0 and 1}.",
    "issueKey must be one of the catalog's issueKey values, or null if nothing matches well.",
    "Do not explain. Do not invent an issueKey not in the catalog.",
  ].join(" ");

  const user = JSON.stringify({
    municipality: municipalityName,
    query,
    issueCatalog: issueCatalog.map((i) => ({ issueKey: i.issueKey, label: i.label, keywords: i.keywords })),
  });

  const text = await callGemini(system, user);
  const parsed = parseJsonResponse(text);

  if (typeof parsed.confidence !== "number" || !Array.isArray(parsed.keywords)) {
    throw makeError("GEMINI_INVALID_OUTPUT", "classifyIntent response missing required fields");
  }
  return parsed;
}

/**
 * Extracts a source-grounded workflow from official source text.
 * @param {string} issueLabel
 * @param {Array<{sourceId:string, text:string}>} sources - truncated/relevant text only
 * @returns {Promise<{steps:object[], conflicts:object[], missingInformation:string[]}>}
 */
async function extractWorkflow(issueLabel, sources) {
  const system = [
    "You extract a step-by-step civic procedure ONLY from the supplied official source text.",
    "You must never fabricate fees, deadlines, documents, eligibility, offices, or URLs.",
    "If a fact is not explicitly present in the sources, use null for that field and add a note to missingInformation.",
    "Every step that states a concrete fact must include the sourceId(s) it came from in sourceIds.",
    "If sources disagree, add an entry to conflicts describing the disagreement and the sourceIds involved.",
    "Respond with ONLY JSON matching: {\"steps\":[{\"stepId\":string,\"title\":string,\"description\":string,\"dependsOn\":string[],\"sourceIds\":string[],\"fee\":string|null,\"deadline\":string|null,\"documentsRequired\":string[],\"eligibility\":string|null,\"office\":string|null,\"officialUrl\":string|null,\"isUncertain\":boolean,\"uncertaintyNote\":string|null}],\"conflicts\":[{\"description\":string,\"sourceIds\":string[]}],\"missingInformation\":string[]}",
  ].join(" ");

  const user = JSON.stringify({ issue: issueLabel, sources });

  const text = await callGemini(system, user, { retries: 1 });
  const parsed = parseJsonResponse(text);

  if (!Array.isArray(parsed.steps)) {
    throw makeError("GEMINI_INVALID_OUTPUT", "extractWorkflow response missing steps array");
  }
  return {
    steps: parsed.steps,
    conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
    missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
  };
}

module.exports = { classifyIntent, extractWorkflow, MODEL };
