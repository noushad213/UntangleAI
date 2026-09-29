const test = require('node:test');
const assert = require('node:assert/strict');
const search = require('../src/services/search.service');
const extraction = require('../src/services/extraction.service');
const Source = require('../src/models/Source');
const ai = require('../src/services/ai.service');
const logger = require('../src/utils/logger');
const { buildWorkflowFromScratch } = require('../src/services/workflow.service');

const municipality = { _id: 'city1', slug: 'mumbai', name: 'Mumbai', allowedDomains: ['mcgm.gov.in'] };
const importIssue = { issueKey: 'import-clothes', label: 'Import Clothes and Sell Them', keywords: ['import', 'clothes', 'sell'] };
const importQuery = 'how do i import clothes and sell them';
const nationalUrl = 'https://www.dgft.gov.in/CP/?opt=iec';

function captureCollection(t) {
  const boundary = new Error('test workflow extraction boundary');
  const fetched = [];
  t.mock.method(logger, 'info', () => {});
  t.mock.method(logger, 'warn', () => {});
  t.mock.method(Source, 'findOne', async () => null);
  t.mock.method(extraction, 'fetchAndExtract', async (url, allowedDomains) => {
    fetched.push({ url, allowedDomains: [...allowedDomains] });
    return {
      quality: { usable: true },
      extractedText: 'Import clothes and sell them: apply for an Importer Exporter Code, submit the application form and required documents. Pay the application fee and register the business before importing clothes for sale.',
    };
  });
  t.mock.method(Source, 'findOneAndUpdate', async ({ url }, values) => ({ ...values, _id: 'source1', url }));
  t.mock.method(ai, 'extractWorkflow', async (_label, evidence) => {
    assert.ok(evidence.some((chunk) => chunk.sourceId === 'source1'));
    throw boundary;
  });
  return { boundary, fetched };
}

test('import requests can discover DGFT sources', async (t) => {
  const capture = captureCollection(t);
  const searchedDomains = [];
  t.mock.method(search, 'searchGovernmentSources', async (_query, _city, allowedDomains) => {
    searchedDomains.push([...allowedDomains]);
    return allowedDomains.includes('dgft.gov.in') ? [{ url: nationalUrl }] : [];
  });
  let failure;
  try {
    await buildWorkflowFromScratch(municipality, importIssue, importQuery);
  } catch (error) {
    failure = error;
  }
  assert.ok(searchedDomains.some((domains) => domains.includes('dgft.gov.in')), 'DGFT must be included in import source discovery');
  assert.equal(failure, capture.boundary);
  assert.equal(capture.fetched[0].url, nationalUrl);
});

test('DGFT extraction uses the same permitted national scope as import discovery', async (t) => {
  const capture = captureCollection(t);
  t.mock.method(search, 'searchGovernmentSources', async () => [{ url: nationalUrl }]);
  await assert.rejects(buildWorkflowFromScratch(municipality, importIssue, importQuery), (error) => error === capture.boundary);
  assert.equal(capture.fetched.length, 1);
  assert.ok(capture.fetched[0].allowedDomains.includes('dgft.gov.in'), 'DGFT must be allowed when fetching import instructions');
  assert.ok(capture.fetched[0].allowedDomains.includes('mcgm.gov.in'));
  assert.deepEqual(municipality.allowedDomains, ['mcgm.gov.in']);
});

test('property tax discovery retains the municipal allowlist without adding DGFT', async (t) => {
  const searchedDomains = [];
  t.mock.method(logger, 'info', () => {});
  t.mock.method(search, 'searchGovernmentSources', async (_query, _city, allowedDomains) => {
    searchedDomains.push([...allowedDomains]);
    return [];
  });
  await assert.rejects(buildWorkflowFromScratch(
    municipality,
    { issueKey: 'property-tax', label: 'Pay Property Tax', keywords: ['property', 'tax'] },
    'pay my property tax'
  ), { code: 'NO_RELIABLE_SOURCES' });
  assert.ok(searchedDomains.length > 0);
  assert.ok(searchedDomains.every((domains) => domains.includes('mcgm.gov.in') && !domains.includes('dgft.gov.in')));
});

test('compound trade evidence includes GST even when import text ranks higher', async (t) => {
  const boundary = new Error('evidence captured');
  t.mock.method(logger, 'info', () => {});
  t.mock.method(search, 'searchGovernmentSources', async (_query, _city, domains) => [{ url: `https://${domains[0]}/procedure` }]);
  t.mock.method(Source, 'findOne', async ({ url }) => {
    const id = new URL(url).hostname;
    const text = id === 'gst.gov.in' ? 'GST registration application procedure.' : 'how do i import clothes and sell them Importer Exporter Code IEC DGFT import customs retail';
    return {
      _id: id, url, extractionStatus: 'success', quality: { usable: true },
      chunks: Array.from({ length: 4 }, (_, index) => ({ chunkId: `${id}-${index}`, text })),
    };
  });
  t.mock.method(ai, 'extractWorkflow', async (_label, evidence) => {
    assert.ok(evidence.some((chunk) => chunk.sourceId === 'gst.gov.in'), 'retail evidence must survive global ranking');
    assert.ok(evidence.some((chunk) => chunk.sourceId === 'dgft.gov.in'));
    assert.ok(evidence.some((chunk) => chunk.sourceId === 'icegate.gov.in'));
    throw boundary;
  });
  await assert.rejects(buildWorkflowFromScratch(municipality, importIssue, importQuery), (error) => error === boundary);
});
