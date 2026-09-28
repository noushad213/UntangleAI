const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getMaxSourcesPerWorkflow,
  matchCatalogIssue,
} = require('../src/services/workflow.service');
const { getSearchResultLimit } = require('../src/services/search.service');

test('workflow generation considers up to eight official sources by default', () => {
  assert.equal(getMaxSourcesPerWorkflow({}), 8);
});

test('source limits can be reduced for constrained deployments', () => {
  assert.equal(getMaxSourcesPerWorkflow({ MAX_SOURCES_PER_WORKFLOW: '3' }), 3);
  assert.equal(getSearchResultLimit({ SOURCE_SEARCH_RESULT_LIMIT: '6' }), 6);
});

test('source limits reject invalid configuration', () => {
  assert.equal(getMaxSourcesPerWorkflow({ MAX_SOURCES_PER_WORKFLOW: '0' }), 8);
  assert.equal(getSearchResultLimit({ SOURCE_SEARCH_RESULT_LIMIT: '99' }), 10);
});

test('known civic queries can use the municipality catalog without an AI call', () => {
  const issue = matchCatalogIssue('How can I pay my property tax online?', [
    {
      issueKey: 'property_tax_payment',
      label: 'Property Tax Payment',
      keywords: ['property tax', 'tax bill', 'pay tax'],
    },
  ]);

  assert.equal(issue.issueKey, 'property_tax_payment');
  assert.equal(issue.confidence, 1);
});

test('unknown civic queries still require AI classification', () => {
  assert.equal(
    matchCatalogIssue('I need permission for a street performance', [
      { issueKey: 'property_tax_payment', label: 'Property Tax Payment', keywords: ['property tax'] },
    ]),
    null
  );
});
