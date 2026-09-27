const SECTION_RULES = [
  [/^(eligibility|who can apply|eligible applicants?)/i, "eligibility", 100],
  [/(required documents?|documents required|enclosures?|proof of|supporting documents?)/i, "documents_required", 100],
  [/(procedure|how to apply|application process|steps? to|process for)/i, "procedure", 100],
  [/(fee|fees|charges?|payment amount|cost)/i, "fees", 95],
  [/(office|where to submit|submit (the )?application|contact|address|helpline|phone)/i, "office_contact", 85],
  [/(jurisdiction|service area|ward|district|zone|reside|ordinary residence)/i, "service_area", 80],
  [/(appeal|grievance|complaint|review|reconsideration)/i, "appeal_grievance", 80],
  [/(deadline|last date|within \d+ days?|validity|time limit)/i, "deadline", 95],
  [/(form|download|portal|website|online application)/i, "forms_portals", 75],
  [/(definition|means|interpretation|scope)/i, "definitions", 60],
];

const DEFAULT_CHUNK_SIZE = Number(process.env.CIVIC_CHUNK_SIZE) || 3500;
const DEFAULT_CHUNK_OVERLAP = Number(process.env.CIVIC_CHUNK_OVERLAP) || 400;

function detectCivicSection(text) {
  const sample = String(text || "").trim().slice(0, 1200);
  for (const [pattern, sectionType, priority] of SECTION_RULES) {
    if (pattern.test(sample)) return { sectionType, sectionPriority: priority };
  }
  return { sectionType: "general_information", sectionPriority: 30 };
}

function splitAtBoundary(text, start, maxEnd) {
  if (maxEnd >= text.length) return text.length;
  const window = text.slice(start, maxEnd);
  const candidates = ["\n\n", ". ", "; ", " "];
  let best = -1;
  for (const separator of candidates) {
    const position = window.lastIndexOf(separator);
    if (position > best) best = position + separator.length;
  }
  return best > Math.floor(window.length * 0.55) ? start + best : maxEnd;
}

/**
 * Creates bounded chunks while retaining page ranges and global character offsets.
 * It deliberately keeps source text unchanged; context labels are metadata only.
 */
function chunkPages(pages, options = {}) {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const overlap = Math.min(options.overlap ?? DEFAULT_CHUNK_OVERLAP, Math.floor(chunkSize / 2));
  const chunks = [];
  let globalOffset = 0;

  for (const page of pages || []) {
    const text = String(page.text || "").trim();
    const pageNumber = Number(page.pageNumber || 1);
    if (!text) {
      globalOffset += String(page.text || "").length + 1;
      continue;
    }
    let start = 0;
    while (start < text.length) {
      const end = splitAtBoundary(text, start, Math.min(start + chunkSize, text.length));
      const chunkText = text.slice(start, end).trim();
      if (chunkText) {
        const section = detectCivicSection(chunkText);
        chunks.push({
          chunkId: `page-${pageNumber}-${chunks.length + 1}`,
          text: chunkText,
          pageStart: pageNumber,
          pageEnd: pageNumber,
          charStart: globalOffset + start,
          charEnd: globalOffset + end,
          sectionType: section.sectionType,
          sectionPriority: section.sectionPriority,
          ocr: page.ocr === true,
        });
      }
      if (end >= text.length) break;
      start = Math.max(end - overlap, start + 1);
    }
    globalOffset += text.length + 1;
  }
  return chunks;
}

module.exports = { detectCivicSection, chunkPages, SECTION_RULES };
