const test = require("node:test");
const assert = require("node:assert/strict");

const {
  requireAdmin,
  requireAdminForForceRefresh,
  createRateLimiter,
  createCorsOptions,
} = require("../src/middleware/security");

test("CORS accepts configured browser origins and rejects others", async () => {
  const options = createCorsOptions("https://civic.example, https://admin.example");

  await new Promise((resolve, reject) => {
    options.origin("https://civic.example", (error, allowed) => {
      try {
        assert.ifError(error);
        assert.equal(allowed, true);
        resolve();
      } catch (assertionError) {
        reject(assertionError);
      }
    });
  });

  await new Promise((resolve, reject) => {
    options.origin("https://attacker.example", (error) => {
      try {
        assert.equal(error.code, "FORBIDDEN");
        resolve();
      } catch (assertionError) {
        reject(assertionError);
      }
    });
  });
});

function invoke(middleware, req = {}) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      body: null,
      headers: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        resolve({ res: this, nextCalled: false });
      },
      set(name, value) {
        this.headers[name] = String(value);
      },
    };

    middleware(req, res, (error) => resolve({ res, nextCalled: !error, error }));
  });
}

test("requireAdmin rejects requests without a bearer token", async () => {
  const previousToken = process.env.ADMIN_API_TOKEN;
  process.env.ADMIN_API_TOKEN = "test-admin-token-with-enough-entropy";

  try {
    const result = await invoke(requireAdmin, { headers: {} });
    assert.equal(result.error.code, "UNAUTHORIZED");
    assert.equal(result.error.statusCode, 401);
  } finally {
    process.env.ADMIN_API_TOKEN = previousToken;
  }
});

test("requireAdmin accepts the configured bearer token", async () => {
  const previousToken = process.env.ADMIN_API_TOKEN;
  process.env.ADMIN_API_TOKEN = "test-admin-token-with-enough-entropy";

  try {
    const result = await invoke(requireAdmin, {
      headers: { authorization: "Bearer test-admin-token-with-enough-entropy" },
    });
    assert.equal(result.nextCalled, true);
  } finally {
    process.env.ADMIN_API_TOKEN = previousToken;
  }
});

test("force refresh requires administrator authorization", async () => {
  const previousToken = process.env.ADMIN_API_TOKEN;
  process.env.ADMIN_API_TOKEN = "test-admin-token-with-enough-entropy";

  try {
    const result = await invoke(requireAdminForForceRefresh, {
      body: { forceRefresh: true },
      headers: {},
    });
    assert.equal(result.error.code, "UNAUTHORIZED");
  } finally {
    process.env.ADMIN_API_TOKEN = previousToken;
  }
});

test("rate limiter rejects requests after the configured budget", async () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });
  const req = { ip: "203.0.113.10", headers: {} };

  assert.equal((await invoke(limiter, req)).nextCalled, true);
  assert.equal((await invoke(limiter, req)).nextCalled, true);

  const blocked = await invoke(limiter, req);
  assert.equal(blocked.res.statusCode, 429);
  assert.equal(blocked.res.body.error.code, "RATE_LIMITED");
  assert.ok(Number(blocked.res.headers["Retry-After"]) > 0);
});
