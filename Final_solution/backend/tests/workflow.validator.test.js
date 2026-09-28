const test = require("node:test");
const assert = require("node:assert");
const { validateWorkflow, findCycle } = require("../src/validators/workflow.validator");
const { getAllowedSourceDomains } = require("../src/services/search.service");

test('uses trusted government domains when a municipality has no configured allowlist', () => {
  assert.deepEqual(getAllowedSourceDomains([]), ['gov.in', 'nic.in']);
  assert.deepEqual(getAllowedSourceDomains(undefined), ['gov.in', 'nic.in']);
});

test('preserves explicitly configured municipality source domains', () => {
  assert.deepEqual(getAllowedSourceDomains(['mcgm.gov.in']), ['mcgm.gov.in']);
});

test("accepts a valid acyclic workflow with sourced facts", () => {
  const validSourceIds = new Set(["s1"]);
  const workflow = {
    steps: [
      { stepId: "a", title: "Step A", dependsOn: [], sourceIds: ["s1"], fee: "₹50" },
      { stepId: "b", title: "Step B", dependsOn: ["a"], sourceIds: [] },
    ],
  };
  assert.doesNotThrow(() => validateWorkflow(workflow, validSourceIds));
});

test("rejects a step referencing an unknown dependency", () => {
  const workflow = {
    steps: [{ stepId: "a", title: "Step A", dependsOn: ["missing"], sourceIds: [] }],
  };
  assert.throws(() => validateWorkflow(workflow, new Set()), /Workflow failed validation/);
});

test("rejects a step with a fee but no source", () => {
  const workflow = {
    steps: [{ stepId: "a", title: "Step A", dependsOn: [], sourceIds: [], fee: "₹50" }],
  };
  assert.throws(() => validateWorkflow(workflow, new Set()));
});

test("detects a dependency cycle", () => {
  const steps = [
    { stepId: "a", dependsOn: ["b"] },
    { stepId: "b", dependsOn: ["a"] },
  ];
  assert.notStrictEqual(findCycle(steps), null);
});

test("no cycle in a linear chain", () => {
  const steps = [
    { stepId: "a", dependsOn: [] },
    { stepId: "b", dependsOn: ["a"] },
    { stepId: "c", dependsOn: ["b"] },
  ];
  assert.strictEqual(findCycle(steps), null);
});
