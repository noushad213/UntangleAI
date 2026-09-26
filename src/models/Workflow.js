const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema(
  {
    stepId: { type: String, required: true }, // stable within the workflow, e.g. "step_1"
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dependsOn: [{ type: String }], // stepIds this step depends on
    sourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Source" }],

    // Structured facts, each nullable per the "never fabricate" rule.
    fee: { type: String, default: null },
    deadline: { type: String, default: null },
    documentsRequired: [{ type: String }],
    eligibility: { type: String, default: null },
    office: { type: String, default: null },
    officialUrl: { type: String, default: null },

    isUncertain: { type: Boolean, default: false },
    uncertaintyNote: { type: String, default: null },
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema(
  {
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Municipality",
      required: true,
      index: true,
    },
    issueKey: { type: String, required: true, trim: true },

    title: { type: String, required: true },
    steps: [stepSchema],

    conflicts: [
      {
        description: { type: String, required: true },
        sourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Source" }],
      },
    ],

    missingInformation: [{ type: String }],

    status: {
      type: String,
      enum: ["needs_review", "verified", "outdated"],
      default: "needs_review",
    },

    verifiedBy: { type: String, default: null },
    verifiedAt: { type: Date, default: null },

    geminiModel: { type: String, default: null },
    lastRecheckedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Core lookup used for caching: municipalityId + issueKey.
workflowSchema.index({ municipalityId: 1, issueKey: 1 });

module.exports = mongoose.model("Workflow", workflowSchema);
