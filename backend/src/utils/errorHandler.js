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

  const message = statusCode >= 500
    ? "The civic workflow service is temporarily unavailable. Please try again shortly."
    : err.message || "Request failed";
  const body = { error: { code, message } };
  if (err.details && statusCode < 500) {
    body.error.details = err.details;
  }
  res.status(statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler };
