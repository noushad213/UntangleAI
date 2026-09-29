const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(file) {
  const filename = path.resolve(__dirname, '../src', file);
  const loaded = new Module(filename, module);
  loaded.require = (id) => id === '@/types/roadmap' ? {} : module.require(id);
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, filename);
  return loaded.exports;
}

test('generated steps default to medium confidence until evidence is calibrated', () => {
  const { mapWorkflow } = load('lib/civicpath-api.ts');
  const process = mapWorkflow({
    id: 'workflow-1', title: 'Test', municipalityId: 'city-1', issueKey: 'test',
    status: 'needs_review', edges: [], conflicts: [], missingInformation: [],
    nodes: [{ id: 'step-1', label: 'Apply', data: { isUncertain: false } }],
  }, 'Pune');
  assert.equal(process.steps[0].confidence, 'medium');
});

test('generated workflow mapping rejects empty nodes and dangling edges', () => {
  const { mapWorkflow } = load('lib/civicpath-api.ts');
  const base = { id: 'workflow-1', title: 'Test', municipalityId: 'city-1', issueKey: 'test',
    status: 'needs_review', conflicts: [], missingInformation: [] };
  assert.throws(() => mapWorkflow({ ...base, nodes: [], edges: [] }, 'Pune'), /incomplete workflow/i);
  assert.throws(() => mapWorkflow({ ...base, nodes: [{ id: 'step-1', label: 'Apply', data: {} }],
    edges: [{ from: 'missing', to: 'step-1' }] }, 'Pune'), /incomplete workflow/i);
});
