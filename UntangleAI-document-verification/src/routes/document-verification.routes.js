const express = require("express");
const { parseDocumentUpload } = require("../middleware/document-upload");
const { createDocumentVerificationController } = require("../controllers/document-verification.controller");

function createDocumentVerificationRouter(options = {}) {
  const router = express.Router();
  router.post("/verify", parseDocumentUpload, createDocumentVerificationController(options));
  return router;
}

module.exports = { createDocumentVerificationRouter };
