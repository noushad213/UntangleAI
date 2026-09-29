const Workflow = require("../../../models/Workflow");
const { makeError } = require("../../../utils/errors");
const { normalizeDocumentType } = require("../document-types");

function inferExpectedDocumentType(title) {
  if (typeof title !== "string") return null;
  const text = title.normalize("NFKC").toLowerCase();
  if (text.includes("pan") && !text.includes("company")) return "pan";
  if (/aadhaar|aadhar|uidai/.test(text)) return "aadhaar";
  if (text.includes("passport")) return "passport";
  if (/driving licen[cs]e/.test(text)) return "driving_license";
  if (/voter|epic/.test(text)) return "voter_id";
  if (/domicile|residence certificate|adhivas/.test(text)) return "domicile_certificate";
  if (/birth certificate|janma|dakha/.test(text)) return "birth_certificate";
  if (/income certificate|utpann/.test(text)) return "income_certificate";
  return null;
}

function createExpectedDocumentTypeResolver({ findById = (id) => Workflow.findById(id) } = {}) {
  return async function resolveExpectedDocumentType(req) {
    const { workflowId, stepId, requirementIndex } = req.body || {};
    const index = Number(requirementIndex);
    if (!workflowId || !stepId || !Number.isInteger(index) || index < 0) {
      throw makeError("INVALID_REQUEST", "Choose a document requirement from a saved roadmap before checking its type");
    }

    if (!/^[a-f\d]{24}$/i.test(workflowId)) {
      const localExpectedType = normalizeDocumentType(req.body?.expectedDocumentType);
      if (localExpectedType) return localExpectedType;
      throw makeError("INVALID_REQUEST", "Choose a supported document requirement from the roadmap");
    }

    const workflow = await findById(workflowId);
    if (!workflow) throw makeError("NOT_FOUND", "Roadmap not found");
    const step = workflow.steps?.find((item) => item.stepId === stepId);
    const requirement = step?.documentsRequired?.[index];
    if (!requirement) throw makeError("NOT_FOUND", "Document requirement not found");

    const expectedType = inferExpectedDocumentType(requirement);
    if (!expectedType) throw makeError("INVALID_REQUEST", "This roadmap requirement cannot be checked by document type");
    return expectedType;
  };
}

module.exports = { inferExpectedDocumentType, createExpectedDocumentTypeResolver };
