const Groq = require("groq-sdk");

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("The GROQ_API_KEY environment variable is missing or empty.");
    }
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

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
  return Math.min(
    1000 * Math.pow(2, attempt - 1),
    8000
  );
}

async function callGroq(
  messages,
  options = {}
) {
  const maxAttempts =
    options.maxAttempts || 2;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      console.log(
        `Groq request attempt ${attempt}`
      );

      const client = getGroqClient();
      const response =
        await client.chat.completions.create({
          model:
            process.env.GROQ_MODEL ||
            "openai/gpt-oss-120b",

          messages,

          temperature:
            options.temperature ?? 0,

          max_completion_tokens:
            options.maxCompletionTokens ||
            4096,

          response_format:
            options.responseFormat ||
            {
              type: "json_object",
            },
        });

      const content =
        response?.choices?.[0]?.message
          ?.content;

      if (!content) {
        throw new Error(
          "GROQ_EMPTY_RESPONSE"
        );
      }

      console.log(
        "Groq request successful"
      );

      return content;
    } catch (error) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.error
          ?.message ||
        String(error);

      const decision =
        getRetryDecision(errorMessage);

      console.error(
        "GROQ_FAILED",
        {
          attempt,
          message: errorMessage,
          retry: decision.retry,
          reason: decision.reason,
        }
      );

      if (
        !decision.retry ||
        attempt >= maxAttempts
      ) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          getRetryDelay(attempt)
        )
      );
    }
  }

  throw new Error("GROQ_FAILED");
}

function parseJsonResponse(content) {
  const cleaned = String(content)
    .replace(/```json|```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(
      "GROQ_INVALID_JSON_RESPONSE"
    );
  }
}

/**
 * Understands a natural-language civic query.
 *
 * The issue catalog is optional context only.
 * It is NOT a restriction.
 *
 * The classifier can identify completely new
 * civic issues that are not present in the catalog.
 */
async function classifyIntent(
  query,
  municipalityName,
  issueCatalog = []
) {
  const messages = [
    {
      role: "system",

      content: `
You are a civic-service intent classifier.

Understand the user's natural-language civic request for the specified municipality.

The user may ask about ANY civic issue or government service.

Do NOT restrict the answer to a predefined catalog.

The issue catalog, if supplied, is only optional context for recognizing common known issues.

If the requested issue is not present in the catalog, create a new normalized issue representation.

Return ONLY valid JSON.

Return exactly:

{
  "issueKey": "string",
  "intent": "string",
  "keywords": ["string"],
  "confidence": 0
}

Rules:

- issueKey must be a short, stable, lowercase kebab-case identifier.
- issueKey must describe the core civic service or issue.
- Do not include municipality names in issueKey.
- Do not include dates, names, addresses, or temporary details.
- intent must be a concise human-readable name for the civic service.
- keywords must contain useful search terms related to the issue.
- confidence must be between 0 and 1.
- If the issue is not in the supplied catalog, still create the appropriate issueKey.
- Do not invent random or unrelated issue keys.
- Do not explain the answer.

Examples:

"How do I get a dog license?"
-> "dog-license"

"How can I pay my house tax?"
-> "property-tax-payment"

"How do I get a birth certificate?"
-> "birth-certificate"

"How can I apply for a new water connection?"
-> "water-connection"
`,
    },

    {
      role: "user",

      content: JSON.stringify({
        municipality:
          municipalityName,

        query,

        optionalIssueCatalog:
          Array.isArray(issueCatalog)
            ? issueCatalog.map((item) => ({
                issueKey:
                  item.issueKey,

                label:
                  item.label,

                keywords:
                  item.keywords,
              }))
            : [],
      }),
    },
  ];

  const content =
    await callGroq(messages, {
      temperature: 0,

      responseFormat: {
        type: "json_object",
      },
    });

  const parsed =
    parseJsonResponse(content);

  if (
    typeof parsed.issueKey !==
      "string" ||
    !parsed.issueKey.trim() ||
    typeof parsed.intent !==
      "string" ||
    !parsed.intent.trim() ||
    !Array.isArray(
      parsed.keywords
    ) ||
    typeof parsed.confidence !==
      "number"
  ) {
    throw new Error(
      "GROQ_INVALID_INTENT_OUTPUT"
    );
  }

  return {
    issueKey:
      parsed.issueKey
        .trim()
        .toLowerCase(),

    intent:
      parsed.intent.trim(),

    keywords:
      parsed.keywords
        .filter(
          (keyword) =>
            typeof keyword ===
              "string" &&
            keyword.trim()
        )
        .map(
          (keyword) =>
            keyword.trim()
        ),

    confidence:
      Math.max(
        0,
        Math.min(
          1,
          parsed.confidence
        )
      ),
  };
}

/**
 * Extracts a source-grounded civic workflow.
 *
 * IMPORTANT:
 * Groq must NOT generate official URLs.
 * The backend owns URL resolution.
 */
async function extractWorkflow(
  issueLabel,
  sources
) {
  const messages = [
    {
      role: "system",

      content: `
You extract a step-by-step civic procedure ONLY from the supplied official source material.

You must never fabricate:
- fees
- deadlines
- documents
- eligibility
- offices
- URLs
- procedural steps

If a fact is not explicitly present in the sources:
- use null for that field
- add the missing information to missingInformation

Every concrete factual step must include the sourceId values supporting it.

Every source-grounded factual statement should include evidence containing:
- chunkId
- pageStart
- pageEnd
- short verbatim quote

Do not invent:
- sourceIds
- chunkIds
- page numbers
- quotes
- evidence

IMPORTANT URL RULE:

Never generate, guess, reconstruct, modify, shorten, or invent a URL.

Do not create a URL from:
- a website name
- a page title
- a service name
- your own knowledge

Do not transform a PDF URL into another URL.

Do not transform a webpage URL into another URL.

The field officialUrl MUST ALWAYS be null.

The backend will assign the real official URL from the original source record.

Use sourceIds to identify which source supports each step.

If sources disagree, add an entry to conflicts with:
- description
- sourceIds

If the supplied source material does NOT contain enough evidence to establish at least one genuine procedural step, return:

{
  "steps": [],
  "conflicts": [],
  "missingInformation": [
    "insufficient official procedural evidence"
  ]
}

Do NOT invent a step merely to avoid returning an empty steps array.

Return ONLY valid JSON matching this structure:

{
  "steps": [
    {
      "stepId": "string",
      "title": "string",
      "description": "string",
      "dependsOn": ["string"],
      "sourceIds": ["string"],
      "evidence": [
        {
          "chunkId": "string",
          "pageStart": "number or null",
          "pageEnd": "number or null",
          "quote": "string or null"
        }
      ],
      "fee": "string or null",
      "deadline": "string or null",
      "documentsRequired": ["string"],
      "eligibility": "string or null",
      "office": "string or null",
      "officialUrl": null,
      "isUncertain": true,
      "uncertaintyNote": "string or null"
    }
  ],
  "conflicts": [
    {
      "description": "string",
      "sourceIds": ["string"]
    }
  ],
  "missingInformation": ["string"]
}
`,
    },

    {
      role: "user",

      content: JSON.stringify({
        issue:
          issueLabel,

        sources,
      }),
    },
  ];

  const content =
    await callGroq(messages, {
      temperature: 0,

      maxCompletionTokens:
        4096,

      responseFormat: {
        type: "json_object",
      },
    });

  const parsed =
    parseJsonResponse(content);

  if (!Array.isArray(parsed.steps)) {
    throw new Error(
      "GROQ_INVALID_WORKFLOW_OUTPUT"
    );
  }

  /*
   * IMPORTANT:
   * Groq successfully returned JSON, but it
   * could not construct a source-supported
   * workflow from the supplied evidence.
   *
   * Do NOT allow an empty workflow to reach
   * the normal workflow validator.
   *
   * workflow.service.js will use this error
   * to trigger the next evidence-retrieval step.
   */
  if (parsed.steps.length === 0) {
    throw new Error(
      "GROQ_INSUFFICIENT_EVIDENCE"
    );
  }

  return {
    steps:
      parsed.steps,

    conflicts:
      Array.isArray(
        parsed.conflicts
      )
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
  callGroq,
  classifyIntent,
  extractWorkflow,
  getRetryDecision,
};