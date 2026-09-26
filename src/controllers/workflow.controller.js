const workflowService = require("../services/workflow.service");
const Workflow = require("../models/Workflow");
const { requireString, validateQueryRequest } = require("../validators/request.validator");
const { makeError } = require("../utils/errors");
const logger = require("../utils/logger");

/**
 * POST /api/query
 * Main entry point: natural language -> resolved, graph-ready workflow.
 */
async function query(req, res, next) {
  const startedAt = Date.now();
  try {
    const { query: userQuery, municipalitySlug } = validateQueryRequest(req.body);
    const forceRefresh = req.body.forceRefresh === true;

    const { workflow, classification, fromCache } = await workflowService.resolveWorkflowForQuery(
      userQuery,
      municipalitySlug,
      { forceRefresh }
    );

    logger.info("Query resolved", {
      municipalitySlug,
      issueKey: classification.issueKey,
      fromCache,
      durationMs: Date.now() - startedAt,
    });

    res.json({
      classification,
      fromCache,
      workflow: workflowService.toGraphJson(workflow),
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const id = requireString(req.params.id, "id");
    const workflow = await Workflow.findById(id);
    if (!workflow) throw makeError("NOT_FOUND", "Workflow not found");
    res.json({ workflow: workflowService.toGraphJson(workflow) });
  } catch (err) {
    next(err);
  }
}

async function listForMunicipality(req, res, next) {
  try {
    const municipalityId = requireString(req.params.municipalityId, "municipalityId");
    const workflows = await Workflow.find({ municipalityId }).select("issueKey title status updatedAt");
    res.json({ workflows });
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const id = requireString(req.params.id, "id");
    const verifiedBy = requireString(req.body.verifiedBy, "verifiedBy");
    const workflow = await workflowService.markWorkflowVerified(id, verifiedBy);
    res.json({ workflow: workflowService.toGraphJson(workflow) });
  } catch (err) {
    next(err);
  }
}

module.exports = { query, getById, listForMunicipality, verify };
