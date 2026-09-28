const mongoose = require("mongoose");

const civicQuerySchema = new mongoose.Schema(
  {
    queryText: { type: String, required: true, trim: true },
    normalizedQuery: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    issueKey: { type: String, required: true, trim: true, index: true },
    intentLabel: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "General" },
    queryLanguage: { type: String, default: "en" }, // en | mr | hi | hinglish
    municipalitySlug: { type: String, default: null, index: true }, // null = statewide
    keywords: [{ type: String, trim: true }],
    usageCount: { type: Number, default: 1 },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound and text indexes for rapid lookup with language_override: "none"
// to support Marathi (mr), Hindi (hi), and Devanagari script without MongoDB rejecting language codes
civicQuerySchema.index(
  { queryText: "text", normalizedQuery: "text", keywords: "text" },
  {
    weights: { normalizedQuery: 10, queryText: 5, keywords: 3 },
    name: "CivicQueryTextIndex",
    default_language: "none",
    language_override: "none",
  }
);

civicQuerySchema.index({ normalizedQuery: 1, municipalitySlug: 1 });
civicQuerySchema.index({ issueKey: 1, municipalitySlug: 1 });

module.exports = mongoose.model("CivicQuery", civicQuerySchema);
