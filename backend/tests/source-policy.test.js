const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSourcePlan, classifyTradeQuery, findUncoveredTradeTasks } = require('../src/services/source-policy');
const { buildQuery } = require('../src/services/search.service');
const { assertSafeUrl } = require('../src/utils/urlSecurity');
const dns = require('node:dns').promises;

const city = { name: 'Pune', allowedDomains: ['punecorporation.org'] };

test('import and resale searches cover national trade and local retail authorities separately', () => {
  const plan = buildSourcePlan('how do i import clothes and sell them', city);
  assert.ok(plan.allowedDomains.includes('dgft.gov.in'));
  assert.ok(plan.allowedDomains.includes('icegate.gov.in'));
  assert.ok(plan.allowedDomains.includes('gst.gov.in'));
  assert.ok(plan.allowedDomains.includes('punecorporation.org'));
  assert.equal(plan.searches.length, 4);
  assert.match(plan.searches[0].query, /IEC/);
  assert.match(plan.searches[1].query, /customs/i);
  assert.equal(plan.searches[0].jurisdiction, 'national');
  assert.equal(plan.searches[3].jurisdiction, 'local');
});

test('national searches do not append a municipality or Maharashtra', () => {
  assert.equal(buildQuery('IEC application', 'Pune', { jurisdiction: 'national' }), 'IEC application procedure official India');
  assert.equal(buildQuery('property tax', 'Pune'), 'property tax procedure official Pune Maharashtra');
});

test('local tasks and software imports do not gain national trade authority access', () => {
  for (const query of ['pay property tax', 'import a document', 'export my roadmap as a PDF']) {
    assert.deepEqual(buildSourcePlan(query, city).allowedDomains, city.allowedDomains);
    assert.equal(classifyTradeQuery(query), null);
  }
});

test('different traded goods do not share a cached workflow or a local shop classification', () => {
  const clothes = classifyTradeQuery('import clothes and sell clothes');
  const food = classifyTradeQuery('import food and sell food');
  assert.notEqual(clothes.issueKey, food.issueKey);
  assert.match(clothes.intent, /import clothes and sell clothes/);
  assert.equal(clothes.classifier, 'trade_scope');
});

test('export-only questions use export procedures and omit domestic retail searches', () => {
  const plan = buildSourcePlan('export garments from India', city);
  assert.equal(plan.searches.length, 2);
  assert.match(plan.searches[1].query, /export.*shipping bill/i);
  assert.ok(!plan.allowedDomains.includes('gst.gov.in'));
});

test('trade domains retain HTTPS, hostname and private-address protections', async (t) => {
  const domains = buildSourcePlan('import clothes', city).allowedDomains;
  t.mock.method(dns, 'lookup', async () => [{ address: '8.8.8.8', family: 4 }]);
  assert.equal((await assertSafeUrl('https://content.dgft.gov.in/manual.pdf', domains)).hostname, 'content.dgft.gov.in');
  await assert.rejects(assertSafeUrl('https://dgft.gov.in.attacker.example/manual.pdf', domains));
  await assert.rejects(assertSafeUrl('http://content.dgft.gov.in/manual.pdf', domains));
  t.mock.method(dns, 'lookup', async () => [{ address: '127.0.0.1', family: 4 }]);
  await assert.rejects(assertSafeUrl('https://content.dgft.gov.in/manual.pdf', domains));
});

test('an import-only result cannot silently claim to cover the requested resale task', () => {
  const steps = [{ title: 'Obtain IEC', description: 'Import goods into India' }];
  const gaps = findUncoveredTradeTasks('import clothes and sell them', steps);
  assert.equal(gaps.length, 2);
  assert.ok(gaps.some((gap) => /GST/.test(gap)));
  assert.ok(gaps.some((gap) => /shop/i.test(gap)));
  assert.deepEqual(findUncoveredTradeTasks('import clothes', steps), []);
  assert.deepEqual(findUncoveredTradeTasks('import clothes and sell them', [
    ...steps,
    { title: 'Check GST registration eligibility', description: 'Use official registration criteria' },
    { title: 'Check shop and establishment registration', description: 'Use the state service' },
  ]), []);
});

test('GST paid on imports does not establish resale registration eligibility', () => {
  const gaps = findUncoveredTradeTasks('import clothes and sell them', [
    { title: 'Pay customs duty and GST', description: 'Pay the taxes due on imported goods.' },
  ]);
  assert.ok(gaps.some((gap) => /GST registration/.test(gap)));
});
