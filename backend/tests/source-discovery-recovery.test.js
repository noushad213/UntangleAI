const test = require('node:test');
const assert = require('node:assert/strict');
const search = require('../src/services/search.service');
const Source = require('../src/models/Source');
const ai = require('../src/services/ai.service');
const { buildWorkflowFromScratch } = require('../src/services/workflow.service');

test('an empty first search recovers readable sources before attempting AI extraction', async (t) => {
  const queries = [];
  t.mock.method(search, 'searchGovernmentSources', async (query) => {
    queries.push(query);
    return queries.length === 1 ? [] : [{ url: 'https://www.mcgm.gov.in/checklist' }];
  });
  t.mock.method(Source, 'findOne', async () => ({
    _id: 'source1', extractionStatus: 'success', quality: { usable: true },
    extractedText: 'Restaurant license application procedure: submit the application form and required documents to the municipal health office.',
  }));
  const extractionReached = new Error('test extraction boundary');
  t.mock.method(ai, 'extractWorkflow', async (label, evidence) => {
    assert.equal(label, 'Restaurant License Application');
    assert.ok(evidence.some((chunk) => chunk.sourceId === 'source1'));
    throw extractionReached;
  });
  await assert.rejects(buildWorkflowFromScratch(
    { _id: 'city1', slug: 'mumbai', name: 'Mumbai', allowedDomains: ['mcgm.gov.in'] },
    { issueKey: 'restaurant-license', label: 'Restaurant License Application', keywords: ['restaurant'] },
    'i want to open a restaurant'
  ), (error) => error === extractionReached);
  assert.equal(queries.length, 2);
  assert.match(queries[1], /Restaurant License Application.*documents.*Mumbai/);
});

test('empty recovery searches remain bounded and never invoke AI without evidence', async (t) => {
  let searches = 0;
  t.mock.method(search, 'searchGovernmentSources', async () => { searches++; return []; });
  t.mock.method(ai, 'extractWorkflow', async () => assert.fail('AI must have evidence'));
  await assert.rejects(buildWorkflowFromScratch(
    { _id: 'city1', slug: 'mumbai', name: 'Mumbai', allowedDomains: ['mcgm.gov.in'] },
    { issueKey: 'restaurant-license', label: 'Restaurant License Application', keywords: ['restaurant'] },
    'i want to open a restaurant'
  ), { code: 'NO_RELIABLE_SOURCES' });
  assert.equal(searches, 3);
});
