const test = require("node:test");
const assert = require("node:assert/strict");
const {
  extractHtmlText,
  assessContentQuality,
  discoverAlternateLinks,
  extractPdfText,
  extractImageText,
  extractOfficeText,
} = require("../src/services/extraction.service");
const fs = require("fs/promises");
const path = require("path");
const { spawnSync } = require("child_process");

function commandIsAvailable(command) {
  return !spawnSync(command, ["--version"], { stdio: "ignore" }).error;
}

const hasTesseract = commandIsAvailable("tesseract");
const hasLibreOffice = commandIsAvailable("libreoffice");

const SAMPLE_PDF = Buffer.from(
  "JVBERi0xLjQKJcTl8uXrpOAKMSAwIG9iago8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+\nZW5kb2JqCjIgMCBvYmoKPDwvVHlwZSAvUGFnZXMgL0tpZHMgWzMgMCBSXSAvQ291bnQgMT4+\nZW5kb2JqCjMgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDMwMCAxNDRdIC9Db250ZW50cyA0IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PC9MZW5ndGggNTQ+PnN0cmVhbQpCVAovRjEgMTIgVGYKMzAgMTAwIFRkCihQcm9wZXJ0eSB0YXggcGF5bWVudCBmb3JtKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAxCjAwMDAwMDAwMDAgNjU1MzUgZgowMDAwMDAwMDA5IDAwMDAwIG4KMDAwMDAwMDA1OCAwMDAwMCBuCjAwMDAwMDEyMSAwMDAwMCBuCjAwMDAwMDIyMCAwMDAwMCBuCnRyYWlsZXIKPDwvUm9vdCAxIDAgUiAvU2l6ZSA1Pj4Kc3RhcnR4cmVmCjMyNAolJUVPRgo=",
  "base64"
);

test("extracts readable content from normal HTML", () => {
  const text = extractHtmlText(`
    <html><head><style>hidden</style></head><body>
      <nav>Navigation</nav><main><h1>Property tax payment</h1>
      <p>Submit the application with the assessment number and pay the amount at the municipal counter. The applicant should retain the acknowledgement receipt for future reference and contact the municipal revenue office for assistance.</p></main>
      <script>secret()</script>
    </body></html>`);
  assert.match(text, /Property tax payment/);
  assert.doesNotMatch(text, /Navigation|secret/);
  assert.equal(assessContentQuality(text).usable, true);
});

test("rejects iView/loading placeholder text", () => {
  const result = assessContentQuality("Could not open iView. The iView is not compatible with your browser. Please wait...");
  assert.equal(result.usable, false);
  assert.ok(result.reasons.includes("browser_or_loading_placeholder"));
});

test("finds likely official PDF and document links for fallback retrieval", () => {
  const links = discoverAlternateLinks(
    '<a href="/forms/property-tax.pdf">Download application form</a><a href="/about">About</a>',
    "https://example.gov.in/service"
  );
  assert.deepEqual(links, ["https://example.gov.in/forms/property-tax.pdf"]);
});

test("extracts text from a PDF buffer", async () => {
  const text = await extractPdfText(SAMPLE_PDF);
  assert.match(text, /Property tax payment/i);
});

test("extracts text from a scanned-style image with local OCR", { skip: !hasTesseract }, async () => {
  const image = await fs.readFile(path.join(__dirname, "fixtures", "ocr-government-form.png"));
  const text = await extractImageText(image, ".png");
  assert.match(text, /Government Form Application/i);
});

test("converts an Office-readable HTML document to text with LibreOffice", { skip: !hasLibreOffice }, async () => {
  const text = await extractOfficeText(
    Buffer.from("<html><body><h1>Municipal Permit Application</h1><p>Submit the completed form to the civic office.</p></body></html>"),
    ".html"
  );
  assert.match(text, /Municipal Permit Application/i);
});
