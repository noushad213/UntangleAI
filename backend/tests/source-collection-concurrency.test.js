const test = require('node:test');
const assert = require('node:assert/strict');
const search = require('../src/services/search.service');
const Source = require('../src/models/Source');
const ai = require('../src/services/ai.service');
const extraction = require('../src/services/extraction.service');
const logger = require('../src/utils/logger');
const { buildWorkflowFromScratch } = require('../src/services/workflow.service');

const municipality = { _id: 'city1', slug: 'mumbai', name: 'Mumbai', allowedDomains: ['mcgm.gov.in'] };
const issue = { issueKey: 'restaurant-license', label: 'Restaurant License Application', keywords: ['restaurant'] };
const query = 'restaurant license';
const urlFor = (index) => `https://www.mcgm.gov.in/procedure-${index}`;
const sourceFor = (url) => ({
  _id: url.split('/').pop(), url, extractionStatus: 'success', quality: { usable: true },
  extractedText: 'Restaurant license application procedure: submit the application form and required documents to the municipal health office.',
});

function captureEvidence(t) {
  const boundary = new Error('test extraction boundary');
  let evidence;
  t.mock.method(ai, 'extractWorkflow', async (_label, input) => {
    evidence = input;
    throw boundary;
  });
  t.mock.method(logger, 'info', () => {});
  t.mock.method(logger, 'warn', () => {});
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'dir', () => {});
  const originalLimit = process.env.MAX_SOURCES_PER_WORKFLOW;
  delete process.env.MAX_SOURCES_PER_WORKFLOW;
  t.after(() => {
    if (originalLimit === undefined) delete process.env.MAX_SOURCES_PER_WORKFLOW;
    else process.env.MAX_SOURCES_PER_WORKFLOW = originalLimit;
  });
  return {
    build: () => assert.rejects(buildWorkflowFromScratch(municipality, issue, query), (error) => error === boundary),
    sourceIds: () => evidence.map((chunk) => chunk.sourceId),
  };
}

test('collects three sources concurrently while preserving search order and the eight-source cap', async (t) => {
  const capture = captureEvidence(t);
  t.mock.method(search, 'searchGovernmentSources', async () => Array.from({ length: 12 }, (_, i) => ({ url: urlFor(i) })));
  const requested = [];
  const releases = [];
  let active = 0;
  let peakActive = 0;
  t.mock.method(Source, 'findOne', async ({ url }) => {
    requested.push(url);
    active++;
    peakActive = Math.max(peakActive, active);
    if (requested.length <= 3) await new Promise((resolve) => releases.push(resolve));
    active--;
    return sourceFor(url);
  });

  const pending = capture.build();
  await new Promise(setImmediate);
  const initialRequests = requested.length;
  // Complete the first batch out of order; evidence must keep search priority.
  for (const release of [...releases].reverse()) release();
  // Sequential code also needs its later deferred calls released to report RED.
  while (requested.length < 4) {
    await new Promise(setImmediate);
    for (const release of releases) release();
  }
  await pending;

  assert.equal(initialRequests, 3);
  assert.equal(peakActive, 3);
  assert.deepEqual(requested, Array.from({ length: 8 }, (_, i) => urlFor(i)));
  assert.deepEqual(capture.sourceIds(), Array.from({ length: 8 }, (_, i) => `procedure-${i}`));
});

test('deduplicates URLs and fills failed source slots without exceeding a configured cap', async (t) => {
  const capture = captureEvidence(t);
  process.env.MAX_SOURCES_PER_WORKFLOW = '2';
  t.mock.method(search, 'searchGovernmentSources', async () => [
    null, { url: '' }, { url: 'not a URL' }, { url: urlFor(0) },
    { url: ` ${urlFor(0)} ` }, { url: urlFor(1) }, { url: urlFor(2) }, { url: urlFor(3) },
  ]);
  const requested = [];
  t.mock.method(Source, 'findOne', async ({ url }) => {
    requested.push(url);
    if (url === urlFor(0)) throw new Error('source unavailable');
    return sourceFor(url);
  });
  await capture.build();
  assert.deepEqual(requested, [urlFor(0), urlFor(1), urlFor(2)]);
  assert.deepEqual(capture.sourceIds(), ['procedure-1', 'procedure-2']);
});

test('refetches unusable cached sources through extraction with the municipality allowlist', async (t) => {
  const capture = captureEvidence(t);
  t.mock.method(search, 'searchGovernmentSources', async () => [0, 1, 2].map((index) => ({ url: urlFor(index) })));
  t.mock.method(Source, 'findOne', async ({ url }) => ({ ...sourceFor(url), quality: { usable: false } }));
  const fetched = [];
  t.mock.method(extraction, 'fetchAndExtract', async (url, allowedDomains) => {
    assert.deepEqual(allowedDomains, municipality.allowedDomains);
    fetched.push(url);
    if (url === urlFor(0)) throw new Error('blocked unsafe redirect');
    return { ...sourceFor(url), quality: { usable: url !== urlFor(1) } };
  });
  t.mock.method(Source, 'findOneAndUpdate', async ({ url }, values) => ({ ...values, _id: sourceFor(url)._id }));
  await capture.build();
  assert.deepEqual(fetched, [urlFor(0), urlFor(1), urlFor(2)]);
  assert.deepEqual(capture.sourceIds(), ['procedure-2']);
});

test('recovery searches do not retry previously failed or duplicate URLs', async (t) => {
  const capture = captureEvidence(t);
  let searches = 0;
  t.mock.method(search, 'searchGovernmentSources', async () => {
    searches++;
    return searches === 1
      ? [{ url: urlFor(0) }, { url: urlFor(1) }]
      : [{ url: urlFor(0) }, { url: urlFor(2) }, { url: urlFor(2) }];
  });
  const requested = [];
  t.mock.method(Source, 'findOne', async ({ url }) => {
    requested.push(url);
    if (url !== urlFor(2)) throw new Error('source unavailable');
    return sourceFor(url);
  });
  await capture.build();
  assert.equal(searches, 2);
  assert.deepEqual(requested, [urlFor(0), urlFor(1), urlFor(2)]);
  assert.deepEqual(capture.sourceIds(), ['procedure-2']);
});
