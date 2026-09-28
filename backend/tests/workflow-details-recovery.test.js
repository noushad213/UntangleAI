const test = require('node:test');
const assert = require('node:assert/strict');
const { recoverWorkflowDetails, needsDetailsRecovery } = require('../src/services/workflow-details-recovery');

const original = { steps: [{ stepId: 'apply', title: 'Apply', fee: null, office: 'Municipal office', sourceIds: ['source1'] }], conflicts: [], missingInformation: ['Application fee not found'] };

test('missing facts trigger bounded official searches and validated enrichment', async () => {
  const searches = [];
  let validations = 0;
  const candidate = { ...original, steps: [{ ...original.steps[0], fee: '₹100', sourceIds: ['source1', 'source2'], evidence: [{ chunkId: 'fees', quote: 'Application fee is ₹100.' }] }], missingInformation: [] };
  const result = await recoverWorkflowDetails(original, {
    issueLabel: 'Birth certificate', cityName: 'Pune',
    collectSources: async (query) => searches.push(query),
    reextract: async () => candidate, validate: () => validations++,
  });
  assert.equal(result.steps[0].fee, '₹100');
  assert.equal(searches.length, 1);
  assert.match(searches[0], /Birth certificate.*Pune.*Application fee/);
  assert.equal(validations, 1);
});

test('recovery preserves gaps when retrieval fails, validation fails, or facts are removed', async () => {
  for (const candidate of [
    { ...original, missingInformation: [] },
    { ...original, steps: [{ ...original.steps[0], office: null, fee: '₹100' }], missingInformation: [] },
  ]) {
    assert.equal(await recoverWorkflowDetails(original, {
      collectSources: async () => {}, reextract: async () => candidate, validate: () => {},
    }), original);
  }
  assert.equal(await recoverWorkflowDetails(original, {
    collectSources: async () => { throw new Error('Offline'); },
  }), original);
  assert.equal(await recoverWorkflowDetails(original, {
    collectSources: async () => {},
    reextract: async () => ({ ...original, steps: [{ ...original.steps[0], fee: '₹100' }] }),
    validate: () => { throw new Error('Invalid source'); },
  }), original);
});

test('cached drafts get one recovery attempt while reviewed roadmaps are preserved', () => {
  assert.equal(needsDetailsRecovery({ ...original, status: 'needs_review' }), true);
  assert.equal(needsDetailsRecovery({ ...original, detailsRecoveryAttempted: true }), false);
  assert.equal(needsDetailsRecovery({ ...original, status: 'verified' }), false);
  assert.equal(needsDetailsRecovery({ missingInformation: [] }), false);
});
