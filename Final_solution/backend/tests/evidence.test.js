const test = require('node:test');
const assert = require('node:assert/strict');
const { isQuoteGrounded, normalizeEvidenceText } = require('../src/utils/evidence');

test('grounds exact quotes while tolerating whitespace differences', () => {
  assert.equal(isQuoteGrounded('Applicants must submit\nForm A.', 'Applicants must submit Form A.'), true);
  assert.equal(normalizeEvidenceText(' Applicants must\n submit Form A. '), 'Applicants must submit Form A.');
});

test('rejects invented, blank, non-string, and oversized evidence quotes', () => {
  assert.equal(isQuoteGrounded('Fee is ₹500', 'No fee is listed.'), false);
  assert.equal(isQuoteGrounded('   ', 'Any source text'), false);
  assert.equal(isQuoteGrounded(null, 'Any source text'), false);
  assert.equal(isQuoteGrounded('x'.repeat(601), 'x'.repeat(601)), false);
});
