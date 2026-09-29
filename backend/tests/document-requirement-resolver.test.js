const test = require("node:test");
const assert = require("node:assert/strict");
const {
  inferExpectedDocumentType,
  createExpectedDocumentTypeResolver,
} = require("../src/features/document-verification/services/document-requirement-resolver");

test("infers only supported document types from stored requirement text", () => {
  assert.equal(inferExpectedDocumentType("Aadhaar Card linked to mobile"), "aadhaar");
  assert.equal(inferExpectedDocumentType("Company PAN registration"), null);
  assert.equal(inferExpectedDocumentType("Recent photograph"), null);
});

test("resolves the expected type from a stored workflow requirement", async () => {
  const findById = async () => ({
    steps: [{ stepId: "step-1", documentsRequired: ["PAN Card", "Passport"] }],
  });
  const resolve = createExpectedDocumentTypeResolver({ findById });
  const type = await resolve({
    body: { workflowId: "507f1f77bcf86cd799439011", stepId: "step-1", requirementIndex: "1" },
  });
  assert.equal(type, "passport");
});

test("rejects a client-provided expected type without a stored requirement reference", async () => {
  const resolve = createExpectedDocumentTypeResolver({ findById: async () => null });
  await assert.rejects(
    resolve({ body: { expectedDocumentType: "pan" } }),
    (error) => error.code === "INVALID_REQUEST"
  );
});
