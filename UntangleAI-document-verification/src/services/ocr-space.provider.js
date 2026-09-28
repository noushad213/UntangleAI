const DEFAULT_ENDPOINT = "https://api.ocr.space/parse/image";
const MAX_OCR_RESPONSE_BYTES = 2_000_000;

class OcrProviderError extends Error {
  constructor(code, message, statusCode = 502) {
    super(message);
    this.name = "OcrProviderError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function readJsonBounded(response, maxBytes = MAX_OCR_RESPONSE_BYTES) {
  const declaredLength = Number(response.headers?.get?.("content-length") || 0);
  if (declaredLength > maxBytes) {
    throw new OcrProviderError("OCR_RESPONSE_TOO_LARGE", "OCR provider response exceeded the size limit");
  }
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new OcrProviderError("OCR_RESPONSE_TOO_LARGE", "OCR provider response exceeded the size limit");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new OcrProviderError("OCR_INVALID_RESPONSE", "OCR provider returned an invalid response");
  }
}

function createOcrSpaceProvider(options = {}) {
  const env = options.env || process.env;
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  return {
    async recognize({ buffer, mimeType, filename }) {
      const apiKey = env.OCR_SPACE_API_KEY;
      if (!apiKey || apiKey === "replace_with_your_ocr_space_api_key") {
        throw new OcrProviderError("OCR_NOT_CONFIGURED", "OCR_SPACE_API_KEY is not configured", 503);
      }
      if (typeof fetchImpl !== "function") {
        throw new OcrProviderError("OCR_FETCH_UNAVAILABLE", "This Node.js runtime does not provide fetch", 500);
      }

      const timeoutMs = Number(env.OCR_SPACE_TIMEOUT_MS) || 30_000;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const form = new FormData();
      form.append("file", new Blob([buffer], { type: mimeType }), filename || "document-upload");
      form.append("language", "auto");
      form.append("OCREngine", String(env.OCR_SPACE_ENGINE || "3"));
      form.append("scale", "true");

      try {
        const response = await fetchImpl(env.OCR_SPACE_ENDPOINT || DEFAULT_ENDPOINT, {
          method: "POST",
          headers: { apikey: apiKey },
          body: form,
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new OcrProviderError("OCR_PROVIDER_HTTP_ERROR", `OCR provider returned HTTP ${response.status}`);
        }

        const payload = await readJsonBounded(response);
        if (payload.IsErroredOnProcessing) {
          throw new OcrProviderError("OCR_PROCESSING_FAILED", "OCR provider could not process this document");
        }
        const parsedResults = Array.isArray(payload.ParsedResults) ? payload.ParsedResults : [];
        const text = parsedResults
          .map((result) => typeof result.ParsedText === "string" ? result.ParsedText : "")
          .filter(Boolean)
          .join("\n")
          .slice(0, 100_000);
        if (!text.trim()) {
          throw new OcrProviderError("OCR_NO_TEXT", "No readable text was found in this document");
        }
        return { text, provider: "ocr.space" };
      } catch (error) {
        if (error instanceof OcrProviderError) throw error;
        if (error.name === "AbortError") {
          throw new OcrProviderError("OCR_TIMEOUT", "OCR processing timed out", 504);
        }
        throw new OcrProviderError("OCR_PROVIDER_UNAVAILABLE", "OCR provider request failed", 502);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

module.exports = { createOcrSpaceProvider, OcrProviderError };
