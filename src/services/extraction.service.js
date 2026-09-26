const fetch = require("node-fetch");
const crypto = require("crypto");
const cheerio = require("cheerio");
const { assertSafeUrl } = require("../utils/urlSecurity");
const { makeError } = require("../utils/errors");
const logger = require("../utils/logger");

const MAX_BYTES = Number(process.env.FETCH_MAX_BYTES) || 2_000_000;
const TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS) || 8000;
const MAX_REDIRECTS = Number(process.env.ALLOWED_REDIRECTS) || 3;

/**
 * Fetches a URL safely (HTTPS only, domain-allowlisted, private-IP blocked,
 * size-limited, timed out) and returns cleaned text.
 *
 * @param {string} url
 * @param {string[]} allowedDomains
 * @returns {Promise<{documentType:'html'|'pdf'|'other', extractedText:string, contentHash:string}>}
 */
async function fetchAndExtract(url, allowedDomains = []) {
  const safeUrl = await assertSafeUrl(url, allowedDomains);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(safeUrl.toString(), {
      redirect: "manual", // handle redirects ourselves so each hop is re-validated
      signal: controller.signal,
      headers: { "User-Agent": "CivicPathBot/1.0 (+source-grounded civic workflow assistant)" },
    });

    let redirects = 0;
    while ([301, 302, 303, 307, 308].includes(res.status) && redirects < MAX_REDIRECTS) {
      const location = res.headers.get("location");
      if (!location) break;
      const nextUrl = new URL(location, safeUrl);
      await assertSafeUrl(nextUrl.toString(), allowedDomains); // re-validate every hop
      res = await fetch(nextUrl.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "CivicPathBot/1.0" },
      });
      redirects++;
    }
  } catch (err) {
    logger.error("Source fetch failed", { error: err.message });
    throw makeError("SOURCE_FETCH_FAILED", "Failed to fetch source URL");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw makeError("SOURCE_FETCH_FAILED", `Source returned status ${res.status}`);
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const contentLength = Number(res.headers.get("content-length") || 0);
  if (contentLength && contentLength > MAX_BYTES) {
    throw makeError("SOURCE_FETCH_FAILED", "Source exceeds max allowed size");
  }

  const buf = await res.buffer();
  if (buf.length > MAX_BYTES) {
    throw makeError("SOURCE_FETCH_FAILED", "Source exceeds max allowed size");
  }

  let documentType = "other";
  let extractedText = "";

  try {
    if (contentType.includes("application/pdf") || safeUrl.pathname.endsWith(".pdf")) {
      documentType = "pdf";
      extractedText = await extractPdfText(buf);
    } else if (contentType.includes("text/html") || contentType.includes("application/xhtml")) {
      documentType = "html";
      extractedText = extractHtmlText(buf.toString("utf-8"));
    } else {
      throw makeError("SOURCE_PARSE_FAILED", `Unsupported content type: ${contentType}`);
    }
  } catch (err) {
    if (err.code) throw err;
    logger.error("Source parse failed", { error: err.message });
    throw makeError("SOURCE_PARSE_FAILED", "Failed to parse source content");
  }

  const contentHash = crypto.createHash("sha256").update(extractedText).digest("hex");
  return { documentType, extractedText, contentHash };
}

/** Strips scripts, styles, nav/header/footer boilerplate; returns clean text. */
function extractHtmlText(html) {
  const $ = cheerio.load(html);
  $("script, style, nav, header, footer, noscript, svg, iframe").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return text;
}

/**
 * PDF text extraction. Requires a maintained pdf-parsing dependency to be
 * installed (e.g. `pdf-parse`) before this path is exercised — intentionally
 * not bundled here per the "don't add deps until needed" rule.
 */
async function extractPdfText(buffer) {
  let pdfParse;
  try {
    pdfParse = require("pdf-parse");
  } catch {
    throw makeError(
      "SOURCE_PARSE_FAILED",
      "PDF extraction requested but 'pdf-parse' is not installed. Run: npm install pdf-parse"
    );
  }
  const data = await pdfParse(buffer);
  return data.text.replace(/\s+/g, " ").trim();
}

module.exports = { fetchAndExtract, extractHtmlText };
