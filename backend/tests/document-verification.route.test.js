const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createApp } = require("../src/app");

test("POST /api/documents/verify rejects request without consent", async () => {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const formData = new FormData();
    const blob = new Blob(["%PDF-1.7\ntest"], { type: "application/pdf" });
    formData.append("document", blob, "test.pdf");
    formData.append("workflowId", "507f1f77bcf86cd799439011");
    formData.append("stepId", "step-1");
    formData.append("requirementIndex", "0");

    const res = await fetch(`http://localhost:${port}/api/documents/verify`, {
      method: "POST",
      body: formData,
    });
    const body = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.code, "OCR_CONSENT_REQUIRED");
    assert.strictEqual(body.valid, false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("POST /api/documents/verify rejects client-controlled document expectations", async () => {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const formData = new FormData();
    const blob = new Blob(["%PDF-1.7\ntest"], { type: "application/pdf" });
    formData.append("document", blob, "test.pdf");
    formData.append("expectedDocumentType", "pan");
    formData.append("consentToThirdPartyOcr", "true");

    const res = await fetch(`http://localhost:${port}/api/documents/verify`, {
      method: "POST",
      body: formData,
    });
    const body = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.code, "INVALID_REQUEST");
    assert.strictEqual(body.valid, false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
