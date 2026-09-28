const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../src/lib/civicpath-api.ts');
const loaded = new Module(filename, module);
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { getGeneratedRoadmap } = loaded.exports;

test('generated roadmap confidence is not called high without calibration evidence', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async (url) => String(url).includes('/api/workflows/')
    ? new Response(JSON.stringify({ workflow: {
      id: 'workflow-1', title: 'Test process', municipalityId: 'city-1', issueKey: 'test',
      status: 'needs_review', nodes: [{ id: 'step-1', label: 'Apply', data: {} }], edges: [],
    } }))
    : new Response(JSON.stringify({ municipalities: [{ _id: 'city-1', name: 'Pune', slug: 'pune' }] }));

  const roadmap = await getGeneratedRoadmap('workflow-1');
  assert.equal(roadmap.steps[0].confidence, 'medium');
  assert.equal(roadmap.review.status, 'needs_review');
});
