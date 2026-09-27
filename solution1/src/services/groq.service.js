const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function getRetryDecision(errorMessage = "") {
  const message = String(errorMessage).toLowerCase();

  if (
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("429")
  ) {
    return {
      retry: true,
      reason: "rate_limit",
    };
  }

  if (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("network") ||
    message.includes("econnreset") ||
    message.includes("enotfound")
  ) {
    return {
      retry: true,
      reason: "network_or_timeout",
    };
  }

  if (
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("service unavailable")
  ) {
    return {
      retry: true,
      reason: "server_error",
    };
  }

  return {
    retry: false,
    reason: "non_retryable",
  };
}

function getRetryDelay(attempt) {
  return Math.min(1000 * Math.pow(2, attempt - 1), 8000);
}

async function callGroq(messages, options = {}) {
  const maxAttempts = options.maxAttempts || 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Groq request attempt ${attempt}`);

      const response = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL,
        messages,
        temperature: options.temperature ?? 0,
        max_completion_tokens: options.maxCompletionTokens || 4096,
        response_format: options.responseFormat || undefined,
      });

      const content = response?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("GROQ_EMPTY_RESPONSE");
      }

      console.log("Groq request successful");

      return content;
    } catch (error) {
      const errorMessage =
        error?.message || error?.response?.data?.error?.message || String(error);

      const decision = getRetryDecision(errorMessage);

      console.error("GROQ_FAILED", {
        attempt,
        message: errorMessage,
        retry: decision.retry,
        reason: decision.reason,
      });

      if (!decision.retry || attempt >= maxAttempts) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, getRetryDelay(attempt))
      );
    }
  }

  throw new Error("GROQ_FAILED");
}

async function classifyIntent(query) {
  const messages = [
    {
      role: "system",
      content: `
You classify civic-service queries.

Return ONLY valid JSON.

The JSON must contain:
{
  "issueKey": "string",
  "confidence": number
}

Do not invent facts.
Use the user's query only for classification.
`,
    },
    {
      role: "user",
      content: query,
    },
  ];

  const content = await callGroq(messages, {
    temperature: 0,
    responseFormat: {
      type: "json_object",
    },
  });

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error("GROQ_INVALID_INTENT_JSON");
  }
}

async function extractWorkflow(prompt) {
  const messages = [
    {
      role: "system",
      content: `
You are a source-grounded civic workflow extraction assistant.

Use ONLY the information provided in the source material.

Do NOT invent:
- fees
- deadlines
- documents
- eligibility
- office locations
- URLs
- procedural steps

If the source material does not provide a required detail, do not guess it.

Return ONLY valid JSON.
`,
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const content = await callGroq(messages, {
    temperature: 0,
    responseFormat: {
      type: "json_object",
    },
  });

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error("GROQ_INVALID_WORKFLOW_JSON");
  }
}

module.exports = {
  callGroq,
  classifyIntent,
  extractWorkflow,
  getRetryDecision,
};