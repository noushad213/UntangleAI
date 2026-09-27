/**
 * Application-level error with a stable machine-readable code.
 * Controllers/middleware use `code` to decide HTTP status + safe client message.
 */
class AppError extends Error {
  constructor(code, message, statusCode = 400, details = undefined) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const Codes = {
  INVALID_REQUEST: 400,
  MUNICIPALITY_NOT_FOUND: 404,
  ISSUE_NOT_RECOGNIZED: 404,
  SEARCH_FAILED: 502,
  SOURCE_FETCH_FAILED: 502,
  SOURCE_PARSE_FAILED: 502,
  GEMINI_FAILED: 502,
  GEMINI_INVALID_OUTPUT: 502,
  VALIDATION_FAILED: 422,
  NO_RELIABLE_SOURCES: 404,
  DATABASE_ERROR: 500,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

function makeError(code, message, details) {
  const statusCode = Codes[code] || 500;
  return new AppError(code, message, statusCode, details);
}

module.exports = { AppError, Codes, makeError };
