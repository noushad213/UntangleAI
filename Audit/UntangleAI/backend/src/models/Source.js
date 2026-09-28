const mongoose = require("mongoose");

const sourceSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true, lowercase: true },
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Municipality",
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ["html", "pdf", "other"],
      default: "html",
    },

    // Extracted, cleaned text (scripts/styles/nav stripped for html).
    extractedText: { type: String, default: null },

    // sha256 of extractedText (or raw bytes for binary), used to dedupe
    // and to skip reprocessing unchanged content.
    contentHash: { type: String, index: true },

    // Provenance and quality metadata are produced by the backend, never by Gemini.
    resolvedUrl: { type: String, default: null },
    retrievalMethod: {
      type: String,
      enum: ["http", "alternate_document", "browser", "filestack"],
      default: "http",
    },
    extractionMethod: { type: String, default: null },
    pages: { type: [mongoose.Schema.Types.Mixed], default: [] },
    chunks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    quality: {
      usable: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      reasons: { type: [String], default: [] },
      characterCount: { type: Number, default: 0 },
      wordCount: { type: Number, default: 0 },
      language: { type: String, default: "unknown" },
      devanagariRatio: { type: Number, default: 0 },
      replacementCharacterRatio: { type: Number, default: 0 },
      legacyFontSuspected: { type: Boolean, default: false },
    },
    attemptedUrls: { type: [mongoose.Schema.Types.Mixed], default: [] },

    issueKeys: [{ type: String, trim: true, index: true }],
    title: { type: String, default: null },

    fetchedAt: { type: Date, default: null },
    lastCheckedAt: { type: Date, default: null },

    extractionStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    extractionError: { type: String, default: null },
  },
  { timestamps: true }
);

sourceSchema.index({ municipalityId: 1, url: 1 }, { unique: true });
sourceSchema.index({ municipalityId: 1, issueKeys: 1 });

module.exports = mongoose.model("Source", sourceSchema);
