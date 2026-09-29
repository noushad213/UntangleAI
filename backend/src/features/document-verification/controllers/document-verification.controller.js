const { createDocumentVerificationService } = require("../services/document-verification.service");

function createDocumentVerificationController(options = {}) {
  const service = options.service || createDocumentVerificationService(options);

  return async function verifyDocument(req, res) {
    try {
      if (req.body?.consentToThirdPartyOcr !== "true") {
        return res.status(400).json({
          valid: false,
          code: "OCR_CONSENT_REQUIRED",
          message: "Consent is required before sending this document to the external OCR provider.",
        });
      }

      if (typeof options.resolveExpectedDocumentType !== "function") {
        throw Object.assign(new Error("Document requirement resolution is not configured"), {
          code: "SERVICE_UNAVAILABLE",
          statusCode: 503,
        });
      }
      const expectedDocumentType = await options.resolveExpectedDocumentType(req);
      const result = await service.verify({
        file: req.file,
        expectedDocumentType,
      });
      return res.status(result.valid ? 200 : 422).json(result);
    } catch (error) {
      const statusCode = Number(error.statusCode) || 500;
      return res.status(statusCode).json({
        valid: false,
        code: error.code || "DOCUMENT_VERIFICATION_FAILED",
        message: statusCode >= 500 ? "Document verification is temporarily unavailable." : error.message,
      });
    }
  };
}

module.exports = { createDocumentVerificationController };
