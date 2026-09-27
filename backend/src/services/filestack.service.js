const fetch = require("node-fetch");
const { makeError } = require("../utils/errors");

const FILESTACK_CDN = "https://cdn.filestackcontent.com";
const SUPPORTED_OUTPUT_FORMATS = new Set([
  "doc", "docx", "html", "jpg", "odp", "ods", "odt", "pdf", "png",
  "ppt", "pptx", "svg", "txt", "webp", "xls", "xlsx",
]);

function assertFormat(format) {
  if (!SUPPORTED_OUTPUT_FORMATS.has(format)) {
    throw makeError("FILESTACK_FAILED", `Unsupported FileStack output format: ${format}`);
  }
}

/**
 * Builds FileStack's transformation URL. The source URL is passed only after
 * CivicPath has already validated it with its own SSRF/domain protections.
 * Policy/signature are optional here and should be supplied for secured apps.
 */
function buildConversionUrl({ apiKey, sourceUrl, format = "txt", policy, signature }) {
  if (!apiKey) throw makeError("FILESTACK_NOT_CONFIGURED", "FILESTACK_API_KEY is not configured");
  if (!sourceUrl) throw makeError("FILESTACK_FAILED", "A source URL is required");
  assertFormat(format);

  const security = policy && signature ? `security=policy:${policy},signature:${signature}/` : "";
  // FileStack's documented external-URL form uses the URL as the final path
  // segment. Avoid logging this URL because it may contain sensitive query data.
  return `${FILESTACK_CDN}/${apiKey}/${security}output=format:${format}/${sourceUrl}`;
}

async function convertUrlToText(sourceUrl, options = {}) {
  const apiKey = options.apiKey || process.env.FILESTACK_API_KEY;
  const format = options.format || process.env.FILESTACK_OUTPUT_FORMAT || "txt";
  const timeoutMs = Number(options.timeoutMs || process.env.FILESTACK_TIMEOUT_MS) || 15_000;
  const maxBytes = Number(options.maxBytes || process.env.FILESTACK_MAX_BYTES) || 2_000_000;
  const httpClient = options.httpClient || fetch;
  const conversionUrl = buildConversionUrl({
    apiKey,
    sourceUrl,
    format,
    policy: options.policy || process.env.FILESTACK_POLICY,
    signature: options.signature || process.env.FILESTACK_SIGNATURE,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await httpClient(conversionUrl, {
      signal: controller.signal,
      headers: { Accept: "text/plain,text/*;q=0.9,*/*;q=0.1" },
    });
    if (!response.ok) {
      throw makeError("FILESTACK_FAILED", `FileStack returned status ${response.status}`);
    }
    const length = Number(response.headers?.get?.("content-length") || 0);
    if (length > maxBytes) throw makeError("FILESTACK_FAILED", "FileStack output exceeds max allowed size");
    const buffer = await response.buffer();
    if (buffer.length > maxBytes) throw makeError("FILESTACK_FAILED", "FileStack output exceeds max allowed size");
    return {
      extractedText: buffer.toString("utf8").replace(/\s+/g, " ").trim(),
      conversionUrl,
      outputFormat: format,
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { buildConversionUrl, convertUrlToText, SUPPORTED_OUTPUT_FORMATS };
