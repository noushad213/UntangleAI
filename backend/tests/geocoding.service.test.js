const test = require('node:test');
const assert = require('node:assert/strict');
const { createGeocoder } = require('../src/services/geocoding.service');

test('invalid office input does not reach the provider', async () => {
  const resolve = createGeocoder({ fetchImpl: () => { throw new Error('Must not fetch'); } });
  for (const query of [undefined, {}, '', 'x'.repeat(301)]) {
    await assert.rejects(resolve(query), { code: 'INVALID_REQUEST' });
  }
});

test('neighbourhoods and malformed coordinates never become office matches', async () => {
  const resolve = createGeocoder({ fetchImpl: async () => ({ ok: true, json: async () => [
    { category: 'place', display_name: 'Bandra', lat: '19', lon: '72' },
    { category: 'office', display_name: 'Invalid Office', lat: 'NaN', lon: '72' },
    { category: 'office', display_name: 'Out of bounds', lat: '91', lon: '72' },
  ] }) });
  assert.deepEqual((await resolve('Bandra office')).matches, []);
});

test('null results and empty coordinates are ignored', async () => {
  const resolve = createGeocoder({ fetchImpl: async () => ({ ok: true, json: async () => [
    null,
    { category: 'office', display_name: 'Broken office', lat: '', lon: null },
  ] }) });
  assert.deepEqual((await resolve('Office')).matches, []);
});

test('office search returns numeric coordinates, attribution and cached matches', async () => {
  let calls = 0;
  const resolve = createGeocoder({ fetchImpl: async (url, options) => {
    calls++;
    assert.equal(new URL(url).searchParams.get('countrycodes'), 'in');
    assert.equal(options.timeout, 5000);
    return { ok: true, json: async () => [{ category: 'office', name: 'Ward Office', display_name: 'Ward Office, Mumbai', lat: '19.1', lon: '72.8' }] };
  } });
  const result = await resolve('Ward Office Mumbai');
  assert.deepEqual(result.matches[0].coordinates, { lat: 19.1, lng: 72.8 });
  assert.match(result.matches[0].navigationUrl, /query=19.1,72.8/);
  assert.equal(result.sourceUrl, 'https://www.openstreetmap.org/copyright');
  assert.deepEqual(await resolve(' ward office mumbai '), result);
  assert.equal(calls, 1);
});

test('uncached simultaneous lookups are limited, then allowed after the interval', async () => {
  let clock = 2000;
  const resolve = createGeocoder({ now: () => clock, fetchImpl: async () => ({ ok: true, json: async () => [] }) });
  await resolve('First office');
  await assert.rejects(resolve('Second office'), { code: 'RATE_LIMITED' });
  clock += 1100;
  assert.deepEqual((await resolve('Second office')).matches, []);
});

test('provider failures return an error instead of a default Mumbai address', async () => {
  for (const fetchImpl of [async () => { throw new Error('timeout'); }, async () => ({ ok: false }), async () => ({ ok: true, json: async () => ({ error: 'bad response' }) })]) {
    await assert.rejects(createGeocoder({ fetchImpl })('Pune ward office'), { code: 'SERVICE_UNAVAILABLE' });
  }
});
