#!/usr/bin/env node

/**
 * Live FileStack smoke test for CivicPath.
 *
 * Usage:
 *   FILESTACK_API_KEY=... node scripts/filestack-live-smoke.js
 *   FILESTACK_API_KEY=... node scripts/filestack-live-smoke.js https://example.gov.in/file.pdf
 *
 * Optional environment variables:
 *   FILESTACK_POLICY, FILESTACK_SIGNATURE
 *   FILESTACK_OUTPUT_FORMAT (default: txt)
 *   FILESTACK_TIMEOUT_MS (default: 30000)
 *   FILESTACK_MAX_BYTES (default: 2000000)
 *   GOVERNMENT_ALLOWED_DOMAINS (default: gov.in,nic.in)
 */

const { assertSafeUrl } = require("../src/utils/urlSecurity");
const { convertUrlToText } = require("../src/services/filestack.service");
const { assessContentQuality } = require("../src/services/extraction.service");

const DEFAULT_PDF_URL =
  "https://ceoelection.maharashtra.gov.in/Downloads/DownloadForms/Form_6A_English.pdf";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

async function main() {
  const apiKey = process.env.FILESTACK_API_KEY;
  if (!apiKey) {
    fail("FILESTACK_API_KEY is not set. Set it in the shell; do not put it in source code or commit it.");
    return;
  }

  const sourceUrl = process.argv[2] || process.env.FILESTACK_TEST_PDF_URL || DEFAULT_PDF_URL;
  const outputFormat = process.env.FILESTACK_OUTPUT_FORMAT || "txt";
  const allowedDomains = (process.env.GOVERNMENT_ALLOWED_DOMAINS || "gov.in,nic.in")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

  let safeUrl;
  try {
    safeUrl = await assertSafeUrl(sourceUrl, allowedDomains);
  } catch (error) {
    fail(`source URL rejected by CivicPath security checks: ${error.message}`);
    return;
  }

  if (!/\.pdf(?:[?#]|$)/i.test(safeUrl.pathname)) {
    console.warn("WARN: URL does not end in .pdf; continuing because the government server may use a download route.");
  }

  console.log("CivicPath FileStack live smoke test");
  console.log(`Source: ${safeUrl.toString()}`);
  console.log(`Output format: ${outputFormat}`);
  console.log(`Allowed source domains: ${allowedDomains.join(", ")}`);
  console.log("Calling FileStack (API key is not printed)...");

  try {
    const result = await convertUrlToText(sourceUrl, {
      apiKey,
      format: outputFormat,
      policy: process.env.FILESTACK_POLICY,
      signature: process.env.FILESTACK_SIGNATURE,
      timeoutMs: Number(process.env.FILESTACK_TIMEOUT_MS) || 30_000,
      maxBytes: Number(process.env.FILESTACK_MAX_BYTES) || 2_000_000,
    });

    const quality = assessContentQuality(result.extractedText);
    console.log(`Returned characters: ${quality.characterCount}`);
    console.log(`Returned words: ${quality.wordCount}`);
    console.log(`Quality usable: ${quality.usable}`);
    console.log(`Quality score: ${quality.score}`);

    if (!quality.usable) {
      fail(`FileStack returned content that CivicPath rejected: ${quality.reasons.join(", ")}`);
      return;
    }

    const lowerText = result.extractedText.toLowerCase();
    const expectedTerms = ["application", "electoral", "form"];
    const matchedTerms = expectedTerms.filter((term) => lowerText.includes(term));
    console.log(`Expected government-PDF terms matched: ${matchedTerms.join(", ") || "none"}`);
    if (matchedTerms.length < 2) {
      fail("conversion returned readable text, but it did not resemble the expected sample government PDF");
      return;
    }

    console.log("PASS: FileStack converted the government PDF into usable text for CivicPath.");
  } catch (error) {
    // Do not print the generated conversion URL: it contains the FileStack API key.
    fail(`FileStack conversion failed: ${error.code || "ERROR"} ${error.message}`);
  }
}

main().catch((error) => fail(`unexpected smoke-test error: ${error.message}`));
