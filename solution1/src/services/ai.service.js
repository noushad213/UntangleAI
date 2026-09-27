const gemini = require("./gemini.service");
const groq = require("./groq.service");
const logger = require("../utils/logger");

function shouldFallbackToGroq(error) {
  const message = String(
    error?.message || error || ""
  ).toLowerCase();

  const statusCode =
    error?.statusCode ||
    error?.status ||
    error?.code;

  // Gemini quota / resource exhaustion
  if (
    message.includes("quota exceeded") ||
    message.includes("quota_exceeded") ||
    message.includes("resource_exhausted") ||
    message.includes("free_tier_requests") ||
    message.includes(
      "generaterequestsperdayperproject"
    )
  ) {
    return true;
  }

  // Temporary Gemini server failures
  if (
    message.includes("503") ||
    message.includes("500") ||
    message.includes("502") ||
    message.includes("504") ||
    message.includes("high demand") ||
    message.includes("unavailable") ||
    statusCode === 500 ||
    statusCode === 502 ||
    statusCode === 503 ||
    statusCode === 504
  ) {
    return true;
  }

  // Network / timeout failures
  if (
    message.includes("timeout") ||
    message.includes("etimedout") ||
    message.includes("econnreset") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("network")
  ) {
    return true;
  }

  // Rate limiting
  if (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    statusCode === 429
  ) {
    return true;
  }

  // Generic Gemini failure.
  // If Gemini service reaches this point, the primary provider
  // has already failed after its own retry logic.
  if (
    message.includes("gemini request failed") ||
    message.includes("gemini_failed")
  ) {
    return true;
  }

  return false;
}

async function classifyIntent(
  query,
  municipalityName,
  issueCatalog
) {
  try {
    logger.info(
      "AI provider: Gemini",
      {
        operation: "classifyIntent",
      }
    );

    return await gemini.classifyIntent(
      query,
      municipalityName,
      issueCatalog
    );
  } catch (error) {
    if (!shouldFallbackToGroq(error)) {
      throw error;
    }

    logger.warn(
      "Gemini failed, falling back to Groq",
      {
        operation: "classifyIntent",
        reason:
          error?.message ||
          String(error),
      }
    );

    logger.info(
      "AI provider: Groq",
      {
        operation: "classifyIntent",
      }
    );

    return await groq.classifyIntent(
      query,
      municipalityName,
      issueCatalog
    );
  }
}

async function extractWorkflow(
  issueLabel,
  sources
) {
  try {
    logger.info(
      "AI provider: Gemini",
      {
        operation: "extractWorkflow",
      }
    );

    return await gemini.extractWorkflow(
      issueLabel,
      sources
    );
  } catch (error) {
    if (!shouldFallbackToGroq(error)) {
      throw error;
    }

    logger.warn(
      "Gemini failed, falling back to Groq",
      {
        operation: "extractWorkflow",
        reason:
          error?.message ||
          String(error),
      }
    );

    logger.info(
      "AI provider: Groq",
      {
        operation: "extractWorkflow",
      }
    );

    return await groq.extractWorkflow(
      issueLabel,
      sources
    );
  }
}

module.exports = {
  classifyIntent,
  extractWorkflow,
  shouldFallbackToGroq,
};