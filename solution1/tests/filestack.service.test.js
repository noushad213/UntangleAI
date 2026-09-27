const test = require("node:test");
const assert = require("node:assert/strict");
const { buildConversionUrl, convertUrlToText } = require("../src/services/filestack.service");

test("builds a FileStack text conversion URL", () => {
  const url = buildConversionUrl({
    apiKey: "test-key",
    sourceUrl: "https://maharashtra.gov.in/forms/notice.pdf",
    format: "txt",
  });
  assert.equal(
    url,
    "https://cdn.filestackcontent.com/test-key/output=format:txt/https://maharashtra.gov.in/forms/notice.pdf"
  );
});

test("converts a FileStack response through the injectable HTTP client", async () => {
  const result = await convertUrlToText("https://maharashtra.gov.in/notice.pdf", {
    apiKey: "test-key",
    httpClient: async () => ({
      ok: true,
      status: 200,
      headers: { get: () => "42" },
      buffer: async () => Buffer.from("Property tax application procedure and required documents."),
    }),
  });
  assert.equal(result.outputFormat, "txt");
  assert.match(result.extractedText, /Property tax application procedure/);
});

test("rejects unsupported output formats before making a request", () => {
  assert.throws(
    () => buildConversionUrl({ apiKey: "test-key", sourceUrl: "https://example.gov.in/a.pdf", format: "exe" }),
    /Unsupported FileStack output format/
  );
});
