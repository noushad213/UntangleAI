const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, selectTargets, warmRoadmaps } = require('../scripts/warm-roadmaps');

test('warmup defaults to a bounded dry run', () => {
  assert.deepEqual(parseArgs([]), {
    execute: false, limit: 10, municipality: null, issues: [], help: false,
  });
  assert.deepEqual(parseArgs([
    '--execute', '--municipality', 'pune', '--limit', '3', '--issue', 'birth_certificate',
  ]), {
    execute: true, limit: 3, municipality: 'pune', issues: ['birth_certificate'], help: false,
  });
});

test('warmup rejects unknown arguments and unbounded or malformed limits', () => {
  for (const args of [
    ['--force-refresh'], ['--limit'], ['--limit', '0'], ['--limit', '51'],
    ['--limit', '1.5'], ['--limit', '2x'], ['--municipality'], ['--issue', '--execute'],
  ]) {
    assert.throws(() => parseArgs(args));
  }
});

const municipalities = [
  {
    slug: 'pune', isActive: true, issueCatalog: [
      { issueKey: 'birth_certificate', label: 'Birth Certificate Application' },
      { issueKey: 'property_tax', label: 'Property Tax Payment' },
      { issueKey: 'birth_certificate', label: 'Duplicate birth entry' },
    ],
  },
  {
    slug: 'inactive', isActive: false,
    issueCatalog: [{ issueKey: 'birth_certificate', label: 'Birth Certificate Application' }],
  },
  {
    slug: 'nagpur', isActive: true,
    issueCatalog: [{ issueKey: 'birth_certificate', label: 'Birth Certificate Application' }],
  },
];

test('warmup selects distinct active catalog issues in stable order within its limit', () => {
  assert.deepEqual(selectTargets(municipalities, parseArgs(['--limit', '2'])), [
    { municipalitySlug: 'nagpur', issueKey: 'birth_certificate', query: 'Birth Certificate Application' },
    { municipalitySlug: 'pune', issueKey: 'birth_certificate', query: 'Birth Certificate Application' },
  ]);
  assert.equal(selectTargets(municipalities, parseArgs([])).length, 3);
});

test('warmup respects municipality and issue filters', () => {
  assert.deepEqual(selectTargets(municipalities, parseArgs([
    '--municipality', 'pune', '--issue', 'property_tax',
  ])), [
    { municipalitySlug: 'pune', issueKey: 'property_tax', query: 'Property Tax Payment' },
  ]);
  assert.deepEqual(selectTargets(municipalities, parseArgs(['--municipality', 'missing'])), []);
});

test('dry runs never invoke roadmap generation', async () => {
  const targets = selectTargets(municipalities, parseArgs([]));
  const summary = await warmRoadmaps(targets, {
    resolveWorkflow: async () => assert.fail('Dry run must not call external services or write workflows'),
  });
  assert.deepEqual(summary, { selected: 3, cached: 0, generated: 0, failed: 0, dryRun: true });
});

test('execution uses normal cache resolution sequentially and reports partial failures', async () => {
  const targets = selectTargets(municipalities, parseArgs([]));
  let active = 0;
  let maxActive = 0;
  const completed = [];
  const summary = await warmRoadmaps(targets, {
    execute: true,
    resolveWorkflow: async (query, municipalitySlug, options) => {
      active++;
      maxActive = Math.max(maxActive, active);
      assert.equal(options, undefined, 'Warmup must preserve normal cache freshness checks');
      await new Promise((resolve) => setImmediate(resolve));
      active--;
      if (municipalitySlug === 'nagpur') throw Object.assign(new Error('No sources'), { code: 'NO_RELIABLE_SOURCES' });
      return { fromCache: query === 'Birth Certificate Application' };
    },
    onResult: (result) => completed.push(result),
  });
  assert.deepEqual(summary, { selected: 3, cached: 1, generated: 1, failed: 1, dryRun: false });
  assert.equal(maxActive, 1);
  assert.deepEqual(completed.map((result) => result.status), ['failed', 'cached', 'generated']);
  assert.equal(completed[0].code, 'NO_RELIABLE_SOURCES');
});
