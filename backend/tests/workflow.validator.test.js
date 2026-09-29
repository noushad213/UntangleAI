const test = require("node:test");
const assert = require("node:assert");
const {
  validateWorkflow,
  findCycle,
  quoteMatchesText,
  groundStepFacts,
} = require("../src/validators/workflow.validator");

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

test("citation quotes must occur in the backend-owned source chunk", () => {
  assert.equal(quoteMatchesText("Bring your PAN card and address proof.", "PAN card and address proof"), true);
  assert.equal(quoteMatchesText("Bring your PAN card and address proof.", "The fee is ₹500"), false);
});

test("unsupported factual fields are removed and marked uncertain", () => {
  const grounded = groundStepFacts({
    stepId: "a",
    fee: "₹500",
    deadline: "30 days",
    documentsRequired: ["PAN card", "Passport"],
    eligibility: "Residents aged 18 or older",
    office: "Ward Office",
    evidence: [{ quote: "Submit a PAN card at the Ward Office. The fee is ₹500." }],
  });

  assert.equal(grounded.fee, "₹500");
  assert.equal(grounded.office, "Ward Office");
  assert.deepEqual(grounded.documentsRequired, ["PAN card"]);
  assert.equal(grounded.deadline, null);
  assert.equal(grounded.eligibility, null);
  assert.equal(grounded.isUncertain, true);
  assert.match(grounded.uncertaintyNote, /deadline/);
  assert.match(grounded.uncertaintyNote, /document requirement/);
  assert.match(grounded.uncertaintyNote, /eligibility/);
});
