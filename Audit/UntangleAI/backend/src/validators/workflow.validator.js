const { makeError } = require("../utils/errors");

/**
 * Validates a workflow object BEFORE it is persisted.
 * Checks: required fields, sourceId existence, dependsOn references,
 * cycle-freedom, and that factual steps carry source evidence.
 *
 * @param {object} workflow - candidate workflow (steps use string stepIds)
 * @param {Set<string>} validSourceIdStrings - sourceIds that actually exist in DB
 * @throws AppError(VALIDATION_FAILED)
 */
function validateWorkflow(workflow, validSourceIdStrings) {
  const problems = [];

  if (!workflow || typeof workflow !== "object") {
    throw makeError("VALIDATION_FAILED", "Workflow must be an object");
  }
  if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) {
    throw makeError("VALIDATION_FAILED", "Workflow must contain at least one step");
  }

  const stepIds = new Set();
  for (const step of workflow.steps) {
    if (!step.stepId || !step.title) {
      problems.push(`Step missing stepId or title: ${JSON.stringify(step)}`);
      continue;
    }
    if (stepIds.has(step.stepId)) {
      problems.push(`Duplicate stepId: ${step.stepId}`);
    }
    stepIds.add(step.stepId);
  }

  for (const step of workflow.steps) {
    // Dependency references must point to a real step.
    for (const dep of step.dependsOn || []) {
      if (!stepIds.has(dep)) {
        problems.push(`Step ${step.stepId} dependsOn unknown step ${dep}`);
      }
    }

    // Source references must exist in DB.
    for (const sid of step.sourceIds || []) {
      if (!validSourceIdStrings.has(String(sid))) {
        problems.push(`Step ${step.stepId} references unknown sourceId ${sid}`);
      }
    }

    // A step asserting a concrete fact needs evidence.
    const hasFact =
      step.fee || step.deadline || step.eligibility || step.office ||
      (step.documentsRequired && step.documentsRequired.length > 0);
    const hasSource = (step.sourceIds || []).length > 0;
    if (hasFact && !hasSource && !step.isUncertain) {
      problems.push(`Step ${step.stepId} states facts without any sourceId`);
    }
  }

  const cycleNode = findCycle(workflow.steps);
  if (cycleNode) {
    problems.push(`Dependency cycle detected involving step ${cycleNode}`);
  }

  for (const conflict of workflow.conflicts || []) {
    if (!conflict.description) {
      problems.push("Conflict entry missing description");
    }
  }

  if (problems.length > 0) {
    throw makeError("VALIDATION_FAILED", "Workflow failed validation", problems);
  }
}

/** Returns a stepId involved in a cycle, or null if the graph is acyclic. */
function findCycle(steps) {
  const graph = new Map(steps.map((s) => [s.stepId, s.dependsOn || []]));
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map(steps.map((s) => [s.stepId, WHITE]));

  function visit(node) {
    color.set(node, GRAY);
    for (const next of graph.get(node) || []) {
      if (!graph.has(next)) continue; // unknown ref already reported separately
      if (color.get(next) === GRAY) return next;
      if (color.get(next) === WHITE) {
        const found = visit(next);
        if (found) return found;
      }
    }
    color.set(node, BLACK);
    return null;
  }

  for (const node of graph.keys()) {
    if (color.get(node) === WHITE) {
      const found = visit(node);
      if (found) return found;
    }
  }
  return null;
}

function quoteMatchesText(text, quote) {
  if (typeof text !== "string" || typeof quote !== "string") return false;
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const normalizedQuote = quote.replace(/\s+/g, " ").trim();
  return Boolean(normalizedQuote) && normalizedText.includes(normalizedQuote);
}

module.exports = { validateWorkflow, findCycle, quoteMatchesText };
