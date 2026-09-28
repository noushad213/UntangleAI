const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(file) {
  const filename = path.resolve(__dirname, '../src', file);
  const loaded = new Module(filename, module);
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, filename);
  return loaded.exports;
}

const { adaptRoadmapForContext } = load('lib/roadmap-adapters.ts');
const { MOCK_ROADMAPS } = load('data/mock-roadmaps.ts');
const filters = { location: 'maharashtra', applicantProfile: 'individual', serviceMode: 'online' };

test('Maharashtra business and driving templates contain no Delhi offices, fees, or links', () => {
  for (const id of ['pvt-ltd-delhi', 'driving-license-delhi']) {
    const original = MOCK_ROADMAPS.find((process) => process.id === id);
    const before = JSON.stringify(original);
    const { adaptedProcess } = adaptRoadmapForContext(original, filters);
    assert.match(adaptedProcess.location, /Maharashtra/);
    for (const step of adaptedProcess.steps) {
      assert.doesNotMatch(JSON.stringify({
        office: step.office, officeLocation: step.officeLocation, fees: step.fees,
        sourceUrl: step.sourceUrl, description: step.description,
      }), /delhi|Mayur Vihar|Shakur Basti|Sarita Vihar|Dwarka/i);
    }
    assert.equal(JSON.stringify(original), before);
  }
});

test('unknown template locations fall back to Maharashtra', () => {
  const { adaptedProcess } = adaptRoadmapForContext(MOCK_ROADMAPS[0], { ...filters, location: 'unknown' });
  assert.match(adaptedProcess.location, /Maharashtra/);
});

test('landing page template shortcuts explicitly select Maharashtra', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../src/components/landing/LandingHero.tsx'), 'utf8');
  const links = [...source.matchAll(/href="(\/roadmap\/[^"?]+)(\?[^\"]*)?"/g)];
  assert.ok(links.length >= 6);
  for (const [, route, query] of links) {
    assert.equal(new URLSearchParams(query).get('location'), 'maharashtra', route);
  }
});
