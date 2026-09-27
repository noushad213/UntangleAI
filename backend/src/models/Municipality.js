const mongoose = require("mongoose");

const municipalitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    state: { type: String, default: "Maharashtra" },
    district: { type: String, trim: true },

    // Domains this municipality's official sources are allowed to come from.
    // Used by urlSecurity + search.service for domain-restricted discovery.
    allowedDomains: [{ type: String, trim: true, lowercase: true }],

    // Known civic issues this municipality supports, keyed for lookup.
    issueCatalog: [
      {
        issueKey: { type: String, required: true, trim: true },
        label: { type: String, required: true },
        keywords: [{ type: String }],
      },
    ],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

municipalitySchema.index({ slug: 1 }, { unique: true });
municipalitySchema.index({ "issueCatalog.issueKey": 1 });

module.exports = mongoose.model("Municipality", municipalitySchema);
