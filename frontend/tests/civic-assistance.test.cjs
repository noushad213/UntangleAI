const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../src/lib/civic-assistance.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const assistanceModule = new Module(filename, module);
assistanceModule._compile(compiled.outputText, filename);
const { buildCoverLetter, getCivicHelpline, safeWebUrl } = assistanceModule.exports;

const step = { title: 'Apply for a water connection', office: 'Water supply office', sourceUrl: 'https://example.gov.in/water', requirements: [{ title: 'Address proof', isMandatory: true }, { title: 'Site plan', isMandatory: false }] };

test('drafts use the current applicant and roadmap requirements without sharing a cache', () => {
  const first = buildCoverLetter(step, 'Pune', { name: 'Alice', address: 'First address', phone: '123' });
  const second = buildCoverLetter(step, 'Pune', { name: 'Bob', address: 'Second address', phone: '456' });
  assert.match(first, /Alice/);
  assert.match(second, /Bob/);
  assert.doesNotMatch(second, /Alice|First address|123/);
  assert.match(second, /Site plan \(optional\)/);
  assert.match(second, /DRAFT/);
  assert.doesNotMatch(second, /Statutory|15 Working|Aadhaar/);
});

test('empty applicant details produce a blank draft instead of invented personal details', () => {
  const draft = buildCoverLetter({ ...step, requirements: [] }, 'Pune', { name: '', address: '', phone: '' });
  assert.match(draft, /____________________/);
  assert.match(draft, /Confirm the required documents/);
});

test('unknown cities and broad regions do not inherit another authority helpline', () => {
  for (const city of ['Thane', 'Pimpri', 'Maharashtra (Mumbai / Pune)', 'New Delhi']) assert.equal(getCivicHelpline(city), null);
  assert.equal(getCivicHelpline('Pune').phone, '18001030222');
  assert.equal(getCivicHelpline('Mumbai').phone, '1916');
  assert.equal(getCivicHelpline('Delhi NCT').phone, '155305');
});

test('only web URLs are accepted for service and form links', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,test', '/relative', '']) assert.equal(safeWebUrl(url), undefined);
  assert.equal(safeWebUrl('https://example.gov.in/form.pdf'), 'https://example.gov.in/form.pdf');
});
