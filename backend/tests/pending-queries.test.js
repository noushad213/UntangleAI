const test = require('node:test');
const assert = require('node:assert/strict');
const { runPendingQuery } = require('../src/utils/pending-queries');

test('overlapping retries share the original build and completed entries are released', async () => {
  let builds = 0;
  let finish;
  const build = () => { builds++; return new Promise((resolve) => { finish = resolve; }); };
  const first = runPendingQuery('same-query', build);
  const retry = runPendingQuery('same-query', build);
  await Promise.resolve();
  assert.equal(builds, 1);
  finish({ id: 'roadmap' });
  const results = await Promise.all([first, retry]);
  assert.deepEqual(results, [{ id: 'roadmap' }, { id: 'roadmap' }]);
  assert.equal(await runPendingQuery('same-query', async () => 'fresh'), 'fresh');
});

test('failed builds can be retried and distinct requests do not share results', async () => {
  await assert.rejects(runPendingQuery('failed-query', async () => { throw new Error('Unavailable'); }), /Unavailable/);
  assert.equal(await runPendingQuery('failed-query', async () => 'recovered'), 'recovered');
  assert.deepEqual(await Promise.all([
    runPendingQuery('mumbai-query', async () => 'Mumbai'),
    runPendingQuery('pune-query', async () => 'Pune'),
  ]), ['Mumbai', 'Pune']);
});
