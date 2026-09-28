const test = require("node:test");
const assert = require("node:assert");
const { validateWorkflow, findCycle, quoteMatchesText } = require("../src/validators/workflow.validator");

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

test("citation quotes must appear verbatim in their source text, allowing whitespace differences", () => {
  assert.equal(
    quoteMatchesText("Required documents:\n- Photo ID\n- Application form", "Photo ID - Application form"),
    true
  );
  assert.equal(quoteMatchesText("Required documents: Photo ID", "Pay ₹500 at the office"), false);
  assert.equal(quoteMatchesText("Required documents: Photo ID", "   "), false);
});
