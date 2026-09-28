const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, '../src', file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const loaded = new Module(filename, module);
  loaded.require = (id) => id in mocks ? mocks[id] : module.require(id);
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

test('unsupported birth certificate queries do not match samples through filler words', async () => {
  const { GET } = load('app/api/v1/search/route.ts', {
    'next/server': { NextResponse: { json: (value) => value } },
    '@/data/mock-roadmaps': { MOCK_ROADMAPS: [
      { id: 'ayushman-bharat', title: 'Health Insurance', description: 'hospital coverage in India', category: 'Health', location: 'All India', steps: [] },
    ] },
    '@/lib/translations': { TRANSLATIONS: { en: { processes: {} } }, getEffectiveLang: () => 'en' },
  });
  const result = await GET({ url: 'http://localhost/api/v1/search?q=I%20need%20a%20birth%20certificate' });
  assert.deepEqual(result.results, []);
});

test('damaged vault data resets safely', () => {
  global.window = {};
  global.localStorage = { getItem: () => '{"documents":null}' };
  const { getStoredTrackingState } = load('lib/document-vault.ts');
  assert.deepEqual(getStoredTrackingState('demo'), { isTrackingActive: false, documents: [] });
  delete global.window;
  delete global.localStorage;
});

test('vague requests ask for the service rather than generating a guessed roadmap', () => {
  const { getPromptAlert } = load('lib/prompt-guardrails.ts');
  for (const query of ['help', 'certificate', 'tax', 'Please help me', 'I need a certificate in Pune']) {
    assert.equal(typeof getPromptAlert(query), 'string', query);
  }
  for (const query of ['birth certificate', 'property tax payment', 'garbage complaint', 'water connection',
    'I want to open a restaurant', 'How do I renew my driving licence in Pune?', 'मुझे पुणे में प्रॉपर्टी टैक्स भरना है।']) {
    assert.equal(getPromptAlert(query), null, query);
  }
});

test('a city mismatch asks the user to correct their service city', () => {
  const { getPromptAlert } = load('lib/prompt-guardrails.ts');
  assert.match(getPromptAlert('birth certificate in Mumbai', 'pune'), /Mumbai.*Pune/);
  assert.equal(getPromptAlert('birth certificate in Mumbai', 'mumbai'), null);
  assert.equal(getPromptAlert('birth certificate', 'pune'), null);
});

test('unsupported states are not submitted as a Maharashtra city', () => {
  const { getPromptAlert } = load('lib/prompt-guardrails.ts');
  for (const query of ['I want to open a restaurant in Madhya Pradesh',
    'I want to open a restaurant in Madhya Prades', 'birth certificate in Karnataka',
    'मुझे मध्य प्रदेश में रेस्टोरेंट खोलना है']) {
    assert.match(getPromptAlert(query, 'mumbai'), /not supported/);
    assert.match(getPromptAlert(query), /not supported/);
  }
  assert.equal(getPromptAlert('property tax payment in Maharashtra', 'pune'), null);
  assert.match(getPromptAlert('open a restaurant', '__other__'), /not supported/);
});

test('generation proxy rejects vague requests before calling the AI service', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = () => { calls += 1; throw new Error('AI service should not be called'); };
  try {
    const { POST } = load('app/api/v1/generate/route.ts', {
      'next/server': { NextResponse: { json: (value, options) => ({ ...value, status: options?.status }) } },
      '@/lib/prompt-guardrails': load('lib/prompt-guardrails.ts'),
    });
    const response = await POST({ json: async () => ({ query: 'help', municipalitySlug: 'pune' }) });
    assert.equal(response.status, 422);
    assert.equal(response.error.code, 'CLARIFICATION_REQUIRED');
    assert.equal(calls, 0);
  } finally {
    global.fetch = originalFetch;
  }
});
