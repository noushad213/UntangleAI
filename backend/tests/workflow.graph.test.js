const test = require("node:test");
const assert = require("node:assert/strict");
const { toGraphJson, isWorkflowFresh } = require("../src/services/workflow.service");

test("workflow freshness expires after the configured window", () => {
  const now = new Date("2026-09-27T12:00:00.000Z");
  const workflow = { lastRecheckedAt: new Date("2026-09-20T11:59:59.000Z") };
  assert.equal(isWorkflowFresh(workflow, 7 * 24 * 60 * 60 * 1000, now), false);
});

test("graph JSON includes review and freshness metadata", () => {
  const workflow = {
    _id: "workflow-1",
    municipalityId: "municipality-1",
    issueKey: "trade-license",
    title: "Apply for a trade license",
    status: "needs_review",
    verifiedBy: null,
    verifiedAt: null,
    lastRecheckedAt: new Date("2026-09-27T08:00:00.000Z"),
    updatedAt: new Date("2026-09-27T09:00:00.000Z"),
    steps: [],
    conflicts: [],
    missingInformation: ["Current fee"],
  };

  const graph = toGraphJson(workflow);

  assert.equal(graph.issueKey, "trade-license");
  assert.equal(graph.municipalityId, "municipality-1");
  assert.equal(graph.lastRecheckedAt, "2026-09-27T08:00:00.000Z");
  assert.deepEqual(graph.missingInformation, ["Current fee"]);
});

test('cached import drafts still report omitted resale requirements', () => {
  const workflow = {
    _id: 'workflow-1', municipalityId: 'city-1', issueKey: 'trade-import',
    title: 'import clothes and sell them', status: 'needs_review',
    steps: [{ stepId: 'iec', title: 'Obtain IEC', description: 'Import goods', dependsOn: [], sourceIds: [] }],
    conflicts: [], missingInformation: [],
  };
  assert.equal(toGraphJson(workflow).missingInformation.length, 2);
  assert.deepEqual(workflow.missingInformation, []);
});
