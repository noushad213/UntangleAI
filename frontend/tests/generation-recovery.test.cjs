const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, '../src', file);
  const loaded = new Module(filename, module);
  loaded.require = (id) => id in mocks ? mocks[id] : module.require(id);
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText, filename);
  return loaded.exports;
}

test('generation distinguishes timeout, connection failure, and invalid service response', async () => {
  const originalFetch = global.fetch;
  const originalError = console.error;
  console.error = () => {};
  try {
    const { POST } = load('app/api/v1/generate/route.ts', {
      'next/server': { NextResponse: { json: (body, options) => ({ ...body, status: options.status }) } },
      '@/lib/prompt-guardrails': { getPromptAlert: () => null },
    });
    for (const [error, status, code] of [
      [new DOMException('timed out', 'TimeoutError'), 504, 'CIVIC_SERVICE_TIMEOUT'],
      [new TypeError('fetch failed'), 503, 'CIVIC_SERVICE_UNAVAILABLE'],
      [new SyntaxError('invalid JSON'), 502, 'INVALID_SERVICE_RESPONSE'],
    ]) {
      global.fetch = async () => { throw error; };
      const result = await POST({ json: async () => ({ query: 'birth certificate', municipalitySlug: 'pune' }) });
      assert.equal(result.status, status);
      assert.equal(result.error.code, code);
      assert.ok(result.error.requestId);
    }
  } finally {
    global.fetch = originalFetch;
    console.error = originalError;
  }
});

test('uploading one attachment leaves checklist completion unchanged', async () => {
  const React = require('react');
  const completions = [];
  const uploads = [];
  const { TrackingWorkspacePane } = load('components/roadmap/TrackingWorkspacePane.tsx', {
    react: { ...React, useMemo: (fn) => fn(), useRef: () => ({ current: null }), useState: () => ['req1', () => {}] },
    '@/lib/document-vault': { formatFileSize: () => '' },
    './TrackingWorkspacePane.module.css': {},
    './CivicAssistance': { CivicAssistance: () => null },
    './DocumentVerificationBadge': { DocumentVerificationBadge: () => null },
  });
  const step = { id: 'step1', title: 'Apply', sourceUrl: '', requirements: [{ id: 'req1', title: 'Identity' }, { id: 'req2', title: 'Address' }] };
  const tree = TrackingWorkspacePane({
    activeStep: step, process: { location: 'Mumbai' }, checkedTasks: {},
    onToggleTask: (...args) => completions.push(args),
    onUploadDocument: async (...args) => uploads.push(args),
  });
  function findFileInput(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'input' && node.props.type === 'file') return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const found = findFileInput(child);
      if (found) return found;
    }
  }
  const file = { name: 'identity.pdf' };
  await findFileInput(tree).props.onChange({ target: { files: [file] } });
  assert.equal(uploads.length, 1);
  assert.deepEqual(uploads[0], [file, 'step1', 'req1']);
  assert.deepEqual(completions, []);
});

test('temporary generation failure recovers once and returns the resulting roadmap', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  let retryCount = 0;
  global.fetch = async () => {
    calls++;
    return calls === 1
      ? { status: 504, ok: false, json: async () => ({ error: { message: 'Taking longer' } }) }
      : { status: 200, ok: true, json: async () => ({ workflow: { id: 'ready-roadmap' } }) };
  };
  try {
    const { generateRoadmap } = load('lib/generate-roadmap.ts');
    const id = await generateRoadmap({ query: 'birth certificate', municipalitySlug: 'pune' }, () => retryCount++);
    assert.equal(id, 'ready-roadmap');
    assert.equal(calls, 2);
    assert.equal(retryCount, 1);
  } finally { global.fetch = originalFetch; }
});

test('missing evidence is reported without retrying and repeated outages stop after two requests', async () => {
  const originalFetch = global.fetch;
  const { generateRoadmap } = load('lib/generate-roadmap.ts');
  try {
    for (const [status, expectedCalls] of [[422, 1], [503, 2]]) {
      let calls = 0;
      global.fetch = async () => {
        calls++;
        return { status, ok: false, json: async () => ({ error: { message: 'Specific failure reason' } }) };
      };
      await assert.rejects(generateRoadmap({ query: 'birth certificate', municipalitySlug: 'pune' }, () => {}), /Specific failure reason/);
      assert.equal(calls, expectedCalls);
    }
  } finally { global.fetch = originalFetch; }
});
