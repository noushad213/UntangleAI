const { createHash } = require('node:crypto');

// These domains are authority choices, not claims about an applicant's obligations.
const TRADE_DOMAINS = ['dgft.gov.in', 'icegate.gov.in', 'cbic.gov.in'];
const SHOP_DOMAINS = ['lms.mahaonline.gov.in', 'aaplesarkar.mahaonline.gov.in', 'rts.maharashtra.gov.in'];
const RETAIL_DOMAINS = ['gst.gov.in', ...SHOP_DOMAINS];

function getTradeScope(query) {
  const text = String(query || '').toLowerCase();
  if (/\b(import|export)\w*\s+(?:(?:my|a|an|the)\s+)?(?:documents?|files?|data|roadmaps?|pdf|csv|code|modules?)\b/.test(text)) return null;
  const imports = /\bimport(?:ing|s|ed)?\b/.test(text);
  const exports = /\bexport(?:ing|s|ed)?\b/.test(text);
  const namedAuthority = /\b(dgft|iec|customs|importer exporter code)\b/.test(text);
  if (!imports && !exports && !namedAuthority) return null;
  return {
    direction: exports && !imports ? 'export' : 'import',
    retail: /\b(sell|selling|resell|reselling|retail|shop|store)\b/.test(text),
  };
}

function classifyTradeQuery(query) {
  const scope = getTradeScope(query);
  if (!scope) return null;
  // Commodity and purpose affect requirements, so a local licence cache is unsafe here.
  const normalized = query.toLowerCase().replace(/\s+/g, ' ').trim();
  const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  return {
    issueKey: `trade-v2-${scope.direction}-${hash}`,
    intent: query.trim(),
    keywords: ['Importer Exporter Code', 'IEC', 'DGFT', scope.direction, 'customs', ...(scope.retail ? ['GST', 'retail'] : [])],
    confidence: 1,
    classifier: 'trade_scope',
  };
}

function buildSourcePlan(query, municipality) {
  const localDomains = [...(municipality.allowedDomains || [])];
  const scope = getTradeScope(query);
  if (!scope) return { allowedDomains: localDomains, searches: [] };
  const searches = [
    { query: 'Importer Exporter Code IEC application required documents DGFT', jurisdiction: 'national', allowedDomains: ['dgft.gov.in'] },
    {
      query: `${query} ${scope.direction} customs ${scope.direction === 'import' ? 'bill of entry' : 'shipping bill'} procedure required documents`,
      jurisdiction: 'national', allowedDomains: ['icegate.gov.in', 'cbic.gov.in'],
    },
  ];
  if (scope.retail) {
    searches.push(
      { query: 'GST registration eligibility application documents retail business', jurisdiction: 'national', allowedDomains: ['gst.gov.in'] },
      { query: 'Shop and Establishment Registration retail shop application documents', jurisdiction: 'local', allowedDomains: SHOP_DOMAINS },
    );
  }
  return {
    allowedDomains: [...new Set([...localDomains, ...TRADE_DOMAINS, ...(scope.retail ? RETAIL_DOMAINS : [])])],
    searches,
    keywords: ['Importer Exporter Code', 'IEC', 'customs', ...(scope.retail ? ['GST', 'shop establishment registration'] : [])],
  };
}

function findUncoveredTradeTasks(query, steps) {
  if (!getTradeScope(query)?.retail) return [];
  const text = steps.map((step) => `${step.title || ''} ${step.description || ''}`).join(' ');
  const gaps = [];
  const coversGstRegistration = steps.some((step) => /(?:\bGST\b|goods and services tax).{0,60}(?:registr|eligib)|(?:registr|eligib).{0,60}(?:\bGST\b|goods and services tax)/i.test(`${step.title || ''} ${step.description || ''}`));
  if (!coversGstRegistration) {
    gaps.push('Whether GST registration applies to selling these goods, and the applicable procedure, remains unresolved.');
  }
  if (!/\bshop\b|\bestablishments?\b|\bgumasta\b/i.test(text)) {
    gaps.push('Whether shop and establishment registration applies to the resale business, and the applicable procedure, remains unresolved.');
  }
  return gaps;
}

module.exports = { buildSourcePlan, classifyTradeQuery, findUncoveredTradeTasks };
