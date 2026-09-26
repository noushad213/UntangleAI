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

module.exports = mongoose.model("Source", sourceSchema);
