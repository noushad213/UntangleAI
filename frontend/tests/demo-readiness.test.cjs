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
  loaded.require = (id) => id in mocks ? mocks[id] : id.startsWith('./') ? load(path.relative(path.resolve(__dirname, '../src'), path.resolve(path.dirname(filename), id + '.ts')), mocks) : module.require(id);
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

test('greetings, gibberish, chatbot chatter, and non-civic topics are rejected upfront without asking for a city', () => {
  const { getPromptAlert } = load('lib/prompt-guardrails.ts');
  // Greetings
  for (const query of ['hello', 'hi', 'hey', 'namaste', 'good morning', 'hello untangle', 'hi there', 'namaste sir']) {
    const alert = getPromptAlert(query);
    assert.equal(typeof alert, 'string', `Expected alert for greeting: "${query}"`);
    assert.match(alert, /service you need help with/i);
  }

  // Gibberish & noise
  for (const query of ['asdf', 'test', '12345', 'qwerty', 'aaaa', 'sdfsdf', 'blah blah']) {
    const alert = getPromptAlert(query);
    assert.equal(typeof alert, 'string', `Expected alert for gibberish: "${query}"`);
    assert.match(alert, /valid government service/i);
  }

  // Chatbot / small talk
  for (const query of ['who are you', 'how are you', 'what can you do', 'tell me a joke', 'are you an ai']) {
    const alert = getPromptAlert(query);
    assert.equal(typeof alert, 'string', `Expected alert for chatbot chatter: "${query}"`);
    assert.match(alert, /Untangle is a guide|navigate official/i);
  }

  // Out of scope
  for (const query of ['order pizza', 'weather in pune', 'write a python code', 'buy shoes online']) {
    const alert = getPromptAlert(query);
    assert.equal(typeof alert, 'string', `Expected alert for out-of-scope query: "${query}"`);
    assert.match(alert, /civic and government procedures/i);
  }

  // City-only input
  for (const query of ['pune', 'mumbai']) {
    const alert = getPromptAlert(query);
    assert.equal(typeof alert, 'string', `Expected alert for city-only query: "${query}"`);
    assert.match(alert, /service you need in this city/i);
  }

  // Greetings accompanied by an actual civic task should be ACCEPTED
  for (const query of [
    'hello, how to renew driving license',
    'hi I want to open a restaurant',
    'namaste, mujhe birth certificate chahiye',
    'good morning, property tax payment in pune',
  ]) {
    assert.equal(getPromptAlert(query), null, `Expected valid query for greeting with task: "${query}"`);
  }
});

test('a city mismatch asks the user to correct their service city', () => {
  const { getPromptAlert } = load('lib/prompt-guardrails.ts');
  assert.match(getPromptAlert('birth certificate in Mumbai', 'pune'), /Mumbai.*Pune/);
  assert.equal(getPromptAlert('birth certificate in Mumbai', 'mumbai'), null);
  assert.equal(getPromptAlert('birth certificate', 'pune'), null);
  assert.match(getPromptAlert('restaurant in Mumbai or Pune', 'pune'), /more than one city/);
});

test('a single city in the prompt resolves to a configured municipality', () => {
  const { resolvePromptMunicipality } = load('lib/prompt-guardrails.ts');
  const cities = [{ slug: 'mumbai', name: 'Mumbai' }, { slug: 'pune', name: 'Pune' }];
  assert.equal(resolvePromptMunicipality('Open a restaurant in MUMBAI.', cities), 'mumbai');
  assert.equal(resolvePromptMunicipality('मुंबई में रेस्टोरेंट खोलना है', cities), 'mumbai');
  assert.equal(resolvePromptMunicipality('Birth certificate in Pune', cities), 'pune');
  assert.equal(resolvePromptMunicipality('Open a restaurant', cities), null);
  assert.equal(resolvePromptMunicipality('Open a restaurant in Mumbai or Pune', cities), null);
  assert.equal(resolvePromptMunicipality('Open a restaurant in Mumbai', [{ slug: 'pune', name: 'Pune' }]), null);
  assert.equal(resolvePromptMunicipality('Open a restaurant in Navi Mumbai', cities), null);
});

test('Maharashtra localities resolve without confusing neighbouring municipalities', () => {
  const { resolvePromptMunicipality, getPromptAlert, classifyPromptLocation } = load('lib/prompt-guardrails.ts');
  const cities = ['mumbai', 'pune', 'navi-mumbai', 'thane', 'pimpri-chinchwad'].map(slug => ({ slug, name: slug }));
  assert.equal(resolvePromptMunicipality('i want to open a cloud kitchen in andheri west', cities), 'mumbai');
  assert.equal(resolvePromptMunicipality('cloud kitchen in अंधेरी पश्चिम', cities), 'mumbai');
  assert.equal(resolvePromptMunicipality('cloud kitchen in Vashi, Navi Mumbai', cities), 'navi-mumbai');
  assert.equal(resolvePromptMunicipality('cloud kitchen in Vashi', cities), 'navi-mumbai');
  assert.equal(resolvePromptMunicipality('cloud kitchen in Wakad, Pune district', cities), 'pimpri-chinchwad');
  assert.equal(resolvePromptMunicipality('cloud kitchen in Thane', cities), 'thane');
  assert.match(getPromptAlert('cloud kitchen in Thane', 'mumbai'), /Thane.*Mumbai/);
  assert.match(getPromptAlert('cloud kitchen in Andheri or Pune'), /more than one/);
  assert.equal(classifyPromptLocation('cloud kitchen in Andheri').region, 'mumbai');
  assert.equal(classifyPromptLocation('cloud kitchen in Ratnagiri').region, 'maharashtra');
  assert.equal(classifyPromptLocation('cloud kitchen').region, 'unknown');
  assert.equal(classifyPromptLocation('cloud kitchen in Delhi').region, 'outside-maharashtra');
  assert.match(getPromptAlert('cloud kitchen', 'delhi'), /not supported/);
  assert.equal(resolvePromptMunicipality('cloud kitchen in Andheri', [{slug:'pune',name:'Pune'}]), null);
  assert.equal(resolvePromptMunicipality('cloud kitchen in Navi Mumbai', [{slug:'mumbai',name:'Mumbai'}]), null);
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
