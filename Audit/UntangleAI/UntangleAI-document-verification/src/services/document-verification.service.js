const { normalizeDocumentType } = require("../document-types");
const { detectDocumentType } = require("../document-type-detector");
const { createOcrSpaceProvider } = require("./ocr-space.provider");

const MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

class DocumentVerificationError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "DocumentVerificationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function assertSupportedFile(file, maxBytes = Number(process.env.DOCUMENT_UPLOAD_MAX_BYTES) || 8_000_000) {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw new DocumentVerificationError("DOCUMENT_REQUIRED", "Upload one document to verify");
  }
  if (!MIME_TYPES.has(file.mimetype)) {
    throw new DocumentVerificationError("UNSUPPORTED_FILE_TYPE", "Upload a PDF, JPEG, or PNG document", 415);
  }
  if (file.size > maxBytes || file.buffer.length > maxBytes) {
    throw new DocumentVerificationError("DOCUMENT_TOO_LARGE", "Document exceeds the upload size limit", 413);
  }

  const bytes = file.buffer;
  const validMagic = file.mimetype === "application/pdf"
    ? bytes.subarray(0, 5).toString("ascii") === "%PDF-"
    : file.mimetype === "image/png"
      ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!validMagic) {
    throw new DocumentVerificationError("FILE_CONTENT_MISMATCH", "File contents do not match the declared file type", 415);
  }
}

function createDocumentVerificationService(options = {}) {
  const ocrProvider = options.ocrProvider || createOcrSpaceProvider(options.ocrOptions);
  const minConfidence = Number(options.minConfidence) || 0.8;

  return {
    async verify({ file, expectedDocumentType }) {
      const expected = normalizeDocumentType(expectedDocumentType);
      if (!expected) {
        throw new DocumentVerificationError(
          "UNSUPPORTED_EXPECTED_DOCUMENT_TYPE",
          "Provide a supported expectedDocumentType",
          400
        );
      }
      assertSupportedFile(file, options.maxBytes);

      const recognition = await ocrProvider.recognize({
        buffer: file.buffer,
        mimeType: file.mimetype,
        filename: file.originalname,
      });
      const detected = detectDocumentType(recognition.text);
      if (!detected.documentType || detected.confidence < minConfidence) {
        return {
          valid: false,
          status: "unverified",
          code: "DOCUMENT_TYPE_UNCLEAR",
          expectedDocumentType: expected,
          detectedDocumentType: null,
          message: "We could not confidently identify this document. Upload a clear, complete image or PDF.",
        };
      }

      if (detected.documentType !== expected) {
        return {
          valid: false,
          status: "mismatch",
          code: "DOCUMENT_TYPE_MISMATCH",
          expectedDocumentType: expected,
          detectedDocumentType: detected.documentType,
          confidence: detected.confidence,
          message: `This upload appears to be ${detected.documentType}, but ${expected} is expected. Upload the correct document.`,
        };
      }

      return {
        valid: true,
        status: "match",
        expectedDocumentType: expected,
        detectedDocumentType: detected.documentType,
        confidence: detected.confidence,
        verificationLevel: "document_type_only",
        message: "The uploaded document type matches the requested field.",
      };
    },
  };
}

module.exports = {
  MIME_TYPES,
  DocumentVerificationError,
  assertSupportedFile,
  createDocumentVerificationService,
};
