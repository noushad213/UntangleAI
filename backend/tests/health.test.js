const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const { createApp } = require("../src/app");
const { getReadinessStatus } = require("../src/routes/health.routes");

test("readiness reports missing live-generation and review configuration without exposing values", () => {
  const status = getReadinessStatus({
    MONGO_URI: "mongodb://configured",
    TAVILY_API_KEY: "search-key",
    GEMINI_API_KEY: "model-key",
  }, 1);
  assert.strictEqual(status.generationReady, true);
  assert.strictEqual(status.reviewReady, false);
  assert.deepStrictEqual(status.missing, ["ADMIN_API_TOKEN"]);
  assert.strictEqual(JSON.stringify(status).includes("search-key"), false);
});

test("GET /api/health returns ok status", async () => {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const res = await fetch(`http://localhost:${port}/api/health`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.status, "ok");

  await new Promise((resolve) => server.close(resolve));
});
