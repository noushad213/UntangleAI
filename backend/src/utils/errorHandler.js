const logger = require("./logger");

function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";

  logger.error("Request failed", {
    code,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    message: err.message,
  });

  const body = { error: { code, message: err.message || "Internal server error" } };
  if (err.details && statusCode < 500) {
    body.error.details = err.details;
  }
  if (process.env.NODE_ENV !== "production" && statusCode >= 500) {
    // Stack traces only in non-production, never sent to client in prod.
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler };
