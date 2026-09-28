const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(file) {
  const filename = path.resolve(__dirname, '../src', file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const loaded = new Module(filename, module);
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
}

test('generated workflows retain their municipality and sourced steps', () => {
  const { adaptRoadmapForContext } = load('lib/roadmap-adapters.ts');
  const process = { id: 'generated-id', location: 'Pune', review: { status: 'needs_review' }, steps: [{ id: 'step', title: 'Apply', requirements: [] }] };
  const result = adaptRoadmapForContext(process, { location: 'pune', applicantProfile: 'individual', serviceMode: 'online' });
  assert.equal(result.adaptedProcess.location, 'Pune');
  assert.deepEqual(result.adaptedProcess.steps, process.steps);
});

test('damaged vault data resets safely', () => {
  global.window = {};
  global.localStorage = { getItem: () => '{"documents":null}' };
  const { getStoredTrackingState } = load('lib/document-vault.ts');
  assert.deepEqual(getStoredTrackingState('demo'), { isTrackingActive: false, documents: [] });
  delete global.window;
  delete global.localStorage;
});
