const crypto = require("crypto");
const { makeError } = require("../utils/errors");

function readBearerToken(req) {
  const value = req.headers?.authorization;
  if (typeof value !== "string" || !value.startsWith("Bearer ")) return null;
  return value.slice(7).trim();
}

function tokensMatch(provided, expected) {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function requireAdmin(req, _res, next) {
  const expectedToken = process.env.ADMIN_API_TOKEN;
  if (!expectedToken) {
    next(makeError("SERVICE_UNAVAILABLE", "Administrator access is not configured"));
    return;
  }

  if (!tokensMatch(readBearerToken(req), expectedToken)) {
    next(makeError("UNAUTHORIZED", "Administrator authorization is required"));
    return;
  }

  req.admin = { id: process.env.ADMIN_REVIEWER_ID || "admin" };
  next();
}

function requireAdminForForceRefresh(req, res, next) {
  if (req.body?.forceRefresh !== true) {
    next();
    return;
  }
  requireAdmin(req, res, next);
}

function createRateLimiter({ windowMs, max }) {
  const requests = new Map();

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const current = requests.get(key);
    const entry = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;

    entry.count += 1;
    requests.set(key, entry);

    res.set("RateLimit-Limit", max);
    res.set("RateLimit-Remaining", Math.max(0, max - entry.count));
    res.set("RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.set("Retry-After", retryAfter);
      res.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: "Too many roadmap requests. Try again after the retry period.",
        },
      });
      return;
    }

    next();
  };
}

function createCorsOptions(configuredOrigins = process.env.CORS_ALLOWED_ORIGINS) {
  const fallback = process.env.NODE_ENV === "production" ? "" : "http://localhost:3000";
  const allowedOrigins = new Set(
    String(configuredOrigins || fallback)
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(makeError("FORBIDDEN", "Browser origin is not allowed"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  };
}

module.exports = {
  requireAdmin,
  requireAdminForForceRefresh,
  createRateLimiter,
  createCorsOptions,
};
