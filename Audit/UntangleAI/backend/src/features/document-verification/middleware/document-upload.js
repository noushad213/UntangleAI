const multer = require("multer");

const MAX_UPLOAD_BYTES = Number(process.env.DOCUMENT_UPLOAD_MAX_BYTES) || 8_000_000;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 3, parts: 5 },
  fileFilter(_req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const error = new Error("Upload a PDF, JPEG, or PNG document");
      error.code = "UNSUPPORTED_FILE_TYPE";
      return callback(error);
    }
    callback(null, true);
  },
});

function parseDocumentUpload(req, res, next) {
  uploadDocument.single("document")(req, res, (error) => {
    if (!error) return next();
    const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 415;
    const code = error.code === "LIMIT_FILE_SIZE" ? "DOCUMENT_TOO_LARGE" : error.code || "UPLOAD_FAILED";
    return res.status(statusCode).json({
      valid: false,
      code,
      message: error.code === "LIMIT_FILE_SIZE" ? "Document exceeds the upload size limit" : error.message,
    });
  });
}

module.exports = { parseDocumentUpload, MAX_UPLOAD_BYTES };
