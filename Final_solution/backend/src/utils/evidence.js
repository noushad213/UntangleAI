function normalizeEvidenceText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function isQuoteGrounded(quote, sourceText, maxLength = 600) {
  const normalizedQuote = normalizeEvidenceText(quote);
  const normalizedSource = normalizeEvidenceText(sourceText);
  return Boolean(normalizedQuote && normalizedQuote.length <= maxLength && normalizedSource.includes(normalizedQuote));
}

module.exports = { normalizeEvidenceText, isQuoteGrounded };
