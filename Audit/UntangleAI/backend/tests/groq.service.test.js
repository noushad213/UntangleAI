const test = require("node:test");
const assert = require("node:assert");
const { getRetryDecision } = require("../src/services/groq.service");

test("getRetryDecision classifies rate limits and 429 as retryable", () => {
  assert.deepStrictEqual(getRetryDecision("Rate limit exceeded: 429"), {
    retry: true,
    reason: "rate_limit",
  });
  assert.deepStrictEqual(getRetryDecision("Too Many Requests"), {
    retry: true,
    reason: "rate_limit",
  });
});

test("getRetryDecision classifies 401 and invalid api keys as auth_failure", () => {
  assert.deepStrictEqual(getRetryDecision("401 Unauthorized"), {
    retry: false,
    reason: "auth_failure",
  });
  assert.deepStrictEqual(getRetryDecision("Invalid API Key provided"), {
    retry: false,
    reason: "auth_failure",
  });
});

test("getRetryDecision classifies server errors 500, 503 as retryable", () => {
  assert.deepStrictEqual(getRetryDecision("503 Service Unavailable"), {
    retry: true,
    reason: "server_error",
  });
});

test("getRetryDecision classifies network and timeout errors as retryable", () => {
  assert.deepStrictEqual(getRetryDecision("ETIMEDOUT connect"), {
    retry: true,
    reason: "network_or_timeout",
  });
});
