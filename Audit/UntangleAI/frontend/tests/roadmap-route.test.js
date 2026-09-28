const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('generated roadmap pages opt out of static rendering', () => {
  const pagePath = path.join(__dirname, '..', 'src', 'app', 'roadmap', '[id]', 'page.tsx');
  const source = fs.readFileSync(pagePath, 'utf8');

  assert.match(source, /export const dynamic = ['"]force-dynamic['"]/);
});
