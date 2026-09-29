const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, '../src', file);
  const loaded = new Module(filename, module);
  loaded.require = (id) => id in mocks ? mocks[id] : id.startsWith('./') ? load(path.relative(path.resolve(__dirname, '../src'), path.resolve(path.dirname(filename), id.endsWith('.ts') ? id : id + '.ts')), mocks) : module.require(id);
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

test('temporary generation failure is not automatically submitted twice', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  let retryCount = 0;
  global.fetch = async () => {
    calls++;
    return { status: 504, ok: false, json: async () => ({ error: { message: 'Taking longer' } }) };
  };
  try {
    const { generateRoadmap } = load('lib/generate-roadmap.ts');
    await assert.rejects(
      generateRoadmap({ query: 'birth certificate', municipalitySlug: 'pune' }, () => retryCount++),
      /Taking longer/
    );
    assert.equal(calls, 1);
    assert.equal(retryCount, 0);
  } finally { global.fetch = originalFetch; }
});

test('missing evidence and outages are both reported without duplicate submissions', async () => {
  const originalFetch = global.fetch;
  const { generateRoadmap } = load('lib/generate-roadmap.ts');
  try {
    for (const [status, expectedCalls] of [[422, 1], [503, 1]]) {
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

test('generation API rejects multi-service requests before contacting the backend', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls++; throw new Error('backend should not be called'); };
  try {
    const { POST } = load('app/api/v1/generate/route.ts', {
      'next/server': { NextResponse: { json: (body, options) => ({ ...body, status: options.status }) } },
      '@/lib/prompt-guardrails': { getPromptAlert: load('lib/prompt-guardrails.ts').getPromptAlert },
    });
    const result = await POST({ json: async () => ({ query: 'birth certificate and driving license', municipalitySlug: 'pune' }) });
    assert.equal(result.status, 422);
    assert.match(result.error.message, /more than one service/i);
    assert.equal(calls, 0);
  } finally { global.fetch = originalFetch; }
});
