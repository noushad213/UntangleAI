const { createDocumentVerificationRouter } = require("./routes/document-verification.routes");
const { createDocumentVerificationService } = require("./services/document-verification.service");
const { detectDocumentType } = require("./document-type-detector");
const { DOCUMENT_TYPES, normalizeDocumentType } = require("./document-types");

module.exports = {
  createDocumentVerificationRouter,
  createDocumentVerificationService,
  detectDocumentType,
  DOCUMENT_TYPES,
  normalizeDocumentType,
};
