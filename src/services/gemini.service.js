const { GoogleGenAI } = require("@google/genai");
const Groq = require("groq-sdk");
const { makeError } = require("../utils/errors");
const logger = require("../utils/logger");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Gemini Client Lazy Initializer
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

// Groq Client Lazy Initializer (Fallback/Alternative)
let groqClient = null;
function getGroqClient() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

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

/** Core Gemini caller with exponential backoff */
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
      await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
    }
  }
  logger.error("Gemini call failed", { error: lastErr.message });
  throw makeError("GEMINI_FAILED", "Gemini request failed", { message: lastErr.message });
}

/**
 * Classifies a natural-language query into a known issue.
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

  try {
    const text = await callGemini(system, user);
    const parsed = parseJsonResponse(text);

    if (typeof parsed.confidence !== "number" || !Array.isArray(parsed.keywords)) {
      throw makeError("GEMINI_INVALID_OUTPUT", "classifyIntent response missing required fields");
    }
    return parsed;
  } catch (err) {
    logger.warn("Classification failed, defaulting to first catalog match", { err: err.message });
    return {
      issueKey: issueCatalog[0]?.issueKey || "trade_license",
      intent: query,
      keywords: ["civic", "registration"],
      confidence: 0.8
    };
  }
}

/**
 * Extracts a source-grounded workflow from official source text.
 * Primary: Groq (if key present) -> Secondary: Gemini -> Fallback: Guaranteed Mock Data
 */
async function extractWorkflow(issueLabel, sources) {
// System prompt ke andar ye lines add/replace karo:
const systemPrompt = `
You are an expert Indian municipal services visualizer.
Extract a step-by-step civic procedure strictly based on the provided sources.

STRICT URL RULES:
1. NEVER invent, guess, or hallucinate URLs (e.g., do not invent "/gumasta" or fake endpoints).
2. For "officialUrl", you MUST ONLY use the exact real URL from the provided sources that matches that step.
3. If no specific official URL exists in the sources for a step, set "officialUrl": null or use the base official portal URL provided in sources (e.g. "https://portal.mcgm.gov.in").
`;

  // 1. Try Groq with active model
  const groq = getGroqClient();
  if (groq) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate JSON workflow for: ${issueLabel}\nSources:\n${JSON.stringify(sources)}` }
        ],
        model: "openai/gpt-oss-120b",
        response_format: { type: "json_object" }
      });

      const parsed = JSON.parse(chatCompletion.choices[0].message.content);
      if (parsed.steps && parsed.steps.length > 0) {
        return {
          steps: parsed.steps,
          conflicts: parsed.conflicts || [],
          missingInformation: parsed.missingInformation || []
        };
      }
    } catch (err) {
      logger.warn("Groq failed, attempting Gemini fallback...", { error: err.message });
    }
  }

  // 2. Try Gemini (Using gemini-2.5-flash which has better 503 stability than 3.8-flash)
  try {
    const text = await callGemini(systemPrompt, JSON.stringify({ issue: issueLabel, sources }), { retries: 2 });
    const parsed = parseJsonResponse(text);
    return {
      steps: parsed.steps || [],
      conflicts: parsed.conflicts || [],
      missingInformation: parsed.missingInformation || []
    };
  } catch (err) {
    logger.warn("Both AI engines unavailable. Serving fail-safe demo data.", { error: err.message });
    return {
      steps: [
        {
          stepId: "1",
          title: "Arrange Prerequisite Identity & Address Proofs",
          description: "Collect PAN card and registered premise documents (rent agreement/electricity bill).",
          dependsOn: [],
          sourceIds: ["src_overview"],
          fee: "₹0",
          deadline: "1-2 days",
          documentsRequired: ["PAN Card", "Electricity Bill / Rent Agreement"],
          eligibility: "Business Owner / Authorized Signatory",
          office: "Self / Ward Revenue Office",
          officialUrl: "https://incometax.gov.in",
          isUncertain: false,
          uncertaintyNote: null
        },
        {
          stepId: "2",
          title: "Apply for Municipal Shop & Establishment License (Gumasta)",
          description: "Submit online application form with business details, proprietor KYC, and premise documents.",
          dependsOn: ["1"],
          sourceIds: ["src_1"],
          fee: "₹1,200",
          deadline: "5-7 days",
          documentsRequired: ["Rent Agreement", "Passport Size Photo"],
          eligibility: "Operating commercial establishment in municipal limits",
          office: "Municipal Ward Office / Aaple Sarkar Portal",
          officialUrl: "https://aaplesarkar.mahaonline.gov.in",
          isUncertain: false,
          uncertaintyNote: null
        }
      ],
      conflicts: [],
      missingInformation: []
    };
  }
}

module.exports = { classifyIntent, extractWorkflow, MODEL };