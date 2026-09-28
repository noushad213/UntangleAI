const test = require("node:test");
const assert = require("node:assert/strict");
const { detectCivicSection, chunkPages } = require("../src/services/civicChunker");
const { assessContentQuality } = require("../src/services/extraction.service");

test("detects high-priority civic sections", () => {
  assert.deepEqual(detectCivicSection("Documents required: identity proof and address proof"), {
    sectionType: "documents_required",
    sectionPriority: 100,
  });
  assert.equal(detectCivicSection("Fee: Rs. 100 payable at the counter").sectionType, "fees");
  assert.equal(detectCivicSection("Appeal may be filed within 30 days").sectionType, "appeal_grievance");
});

test("chunks pages with page and character provenance", () => {
  const chunks = chunkPages([
    { pageNumber: 1, text: "Procedure: " + "Submit the application at the municipal office. ".repeat(30) },
    { pageNumber: 2, text: "Documents required: identity proof and address proof." },
  ], { chunkSize: 100, overlap: 20 });
  assert.ok(chunks.length > 2);
  assert.equal(chunks[0].pageStart, 1);
  assert.ok(chunks.some((chunk) => chunk.pageStart === 2 && chunk.sectionType === "documents_required"));
  assert.ok(chunks.every((chunk) => chunk.charEnd > chunk.charStart));
});

test("flags likely legacy-font output instead of trusting it", () => {
  const result = assessContentQuality("ÀÈÌÒÙ ".repeat(60));
  assert.equal(result.usable, false);
  assert.ok(result.reasons.includes("legacy_font_suspected"));
});
