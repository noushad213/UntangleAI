# Open India Law → CivicPath Adaptation Report

Reference inspected: [Vaquill-AI/open-india-law](https://github.com/Vaquill-AI/open-india-law)

## Executive conclusion

Yes, this repository contains several highly useful ideas for CivicPath, especially for making government-source extraction **auditable, source-grounded, and resilient to difficult Indian PDFs**. It should not be copied wholesale: most of its scrapers, metadata fields, and section rules are specific to court judgments, tribunals, legislation, and legal research.

The best CivicPath adaptation is a smaller civic-document pipeline based on the same principles:

```text
Official URL
  → immutable source record
  → safe retrieval + format detection
  → page-aware extraction/OCR
  → extraction quality classification
  → civic section detection
  → provenance-preserving chunks
  → Gemini workflow extraction
  → graph + citations + needs_review
```

## What Open India Law does well

### 1. Canonical structured records

The repository normalizes heterogeneous court, tribunal, regulator, and legislation sources into schemas with stable IDs, source URLs, dates, titles, document types, and jurisdiction metadata.

**CivicPath adaptation:** add a normalized source/document record with fields such as:

- `sourceId`
- original discovered `url`
- `resolvedUrl`
- `publisher`
- `jurisdiction`
- `municipality`
- `documentType`
- `documentDate`
- `title`
- `contentHash`
- `retrievalMethod`
- `extractionMethod`
- `quality`
- `sourceStatus`

CivicPath already has the beginning of this in `Source`; the next useful step is page-level provenance and document metadata.

### 2. Provenance on every chunk

The repository emphasizes `source_url` on individual provisions/chunks rather than only attaching a URL to a whole search result. Its chunk schema also tracks character offsets, page ranges, chunk index, and total chunks.

**CivicPath adaptation:** when Gemini states a fee, deadline, document requirement, office, or step, store not only `sourceIds` but optionally:

```json
{
  "sourceId": "...",
  "pageStart": 2,
  "pageEnd": 2,
  "charStart": 830,
  "charEnd": 1140,
  "quote": "...short supporting excerpt..."
}
```

The backend must derive the final official URL from `Source.url`; the model must never invent it.

### 3. OCR fallback based on actual text quality

Open India Law checks whether a PDF has enough native text, detects legacy fonts, and then chooses an OCR path for scanned documents. This is stronger than deciding based only on file extension.

**CivicPath adaptation already added:**

- `pdf-parse` first for text PDFs
- `pdftoppm` + Tesseract fallback for scanned PDFs
- Tesseract for image sources
- extraction method tracking
- quality gate before Gemini

**Next improvement:** add OCR confidence, page-level confidence, and language classification to Source quality metadata.

### 4. Section-aware parsing

The repository detects legal sections such as facts, issues, arguments, analysis, conclusion, statutes, relief, and procedure. It also assigns section priority for retrieval.

**CivicPath adaptation:** use civic sections instead of legal-judgment sections:

| Civic section | Example content | Suggested priority |
|---|---|---:|
| `eligibility` | Who can apply | 100 |
| `documents_required` | Proofs, forms, certificates | 100 |
| `procedure` | Ordered application steps | 100 |
| `fees` | Amount and payment method | 95 |
| `deadline` | Submission window or validity | 95 |
| `office_contact` | Office, address, phone, portal | 85 |
| `service_area` | Ward, district, jurisdiction | 80 |
| `appeal_grievance` | Complaint or appeal route | 80 |
| `definitions` | Terms and scope | 60 |
| `general_information` | Background text | 30 |

This section label can be included in Gemini input and used to prioritize chunks without weakening grounding.

### 5. Quality-control and gibberish detection

The repository has explicit checks for legacy Indic-font output such as Kruti Dev-like text, which can look like valid Latin text while being meaningless Hindi. It also performs data quality and corruption checks.

**CivicPath adaptation:** classify extracted text as:

- `empty`
- `placeholder`
- `english`
- `devanagari_unicode`
- `mixed_language`
- `legacy_font_suspected`
- `ocr_low_confidence`
- `usable`

A source classified as `legacy_font_suspected` or `ocr_low_confidence` should not silently become a trusted workflow. It should trigger another strategy or `needs_review`.

### 6. Reproducible source-specific adapters

Open India Law uses per-forum scrapers because Indian government and court websites do not share one reliable interface. CivicPath should use the same principle for difficult municipal portals.

Recommended adapter interface:

```js
{
  name: "mcgm-iview",
  matches(url) { return url.hostname.endsWith("mcgm.gov.in"); },
  async discoverOfficialDocuments(context) { ... },
  async extract(context) { ... },
  validateOutput(text) { ... }
}
```

Adapters must remain behind the same URL security guard and must preserve the original official URL.

### 7. Data-first pipeline rather than database-first extraction

Open India Law uses JSONL/Parquet outputs for large reproducible pipelines and treats the corpus as a dataset. CivicPath is request-driven and MongoDB-backed, so it should not copy that storage model entirely.

A useful hybrid is:

- MongoDB for current Source and Workflow records/cache
- JSONL audit file or object-storage export for extraction runs
- content hash for deduplication
- immutable extraction attempt history for debugging

This would help answer: “Which source version produced this workflow?”

## What should not be copied

1. **Court-specific scrapers and schemas** — they solve a different domain.
2. **Legal section labels** — replace them with civic procedure labels.
3. **Huge corpus assumptions** — CivicPath should fetch only sources needed for a user query.
4. **Unbounded scraping** — retain allowlists, rate limits, timeouts, and size limits.
5. **Hardcoded credentials** — one inspected parser contains a hardcoded third-party parser key. Do not copy it. Rotate/report any exposed credential in a real deployment.
6. **Blind OCR acceptance** — OCR output must pass quality, language, and provenance checks.
7. **Model-generated URLs** — CivicPath's existing backend-owned URL rule is safer and should remain.

The repository is Apache-2.0 licensed, but any reused source code should retain the required license/attribution notices and should be reviewed file-by-file rather than copied wholesale.

## Recommended next CivicPath implementation phases

### Phase 1 — civic chunking and page provenance

Add a parser result shape:

```json
{
  "documentType": "pdf",
  "pages": [
    {
      "pageNumber": 1,
      "text": "...",
      "extractionMethod": "pdf-parse",
      "quality": { "score": 0.93 }
    }
  ],
  "chunks": [
    {
      "chunkId": "source-page-1-001",
      "text": "...",
      "pageStart": 1,
      "pageEnd": 1,
      "sectionType": "documents_required"
    }
  ]
}
```

Use overlap and separator-aware chunking, similar to the reference repository, but keep chunks small enough for Gemini.

### Phase 2 — civic section detector

Implement a deterministic heading/keyword classifier for eligibility, procedure, documents, fees, deadlines, office, appeals, and forms. Pass the labels to Gemini as retrieval context; do not use them as evidence by themselves.

### Phase 3 — extraction-quality classifier

Add:

- replacement-character ratio
- repeated-line ratio
- alphabet/language ratios
- Devanagari detection
- legacy-font suspicion
- OCR confidence if available
- table flattening warning
- per-page quality

### Phase 4 — source-specific adapters

Start with only the most important Maharashtra portals, such as MCGM/iView-style sources, and add an adapter test fixture for each. Do not generalize a portal-specific workaround to all government domains.

### Phase 5 — audit and re-check history

Store an extraction attempt record containing:

- candidate URL
- resolved URL
- retrieval strategy
- HTTP status
- content type
- quality result
- parser version
- source hash
- failure reason
- timestamp

This supports reproducibility and helps detect when a government website changes.

## Practical answer for CivicPath

The reference repository can substantially improve CivicPath's **reliability and explainability**, but the highest-value lessons are architectural:

1. stable normalized records;
2. page/chunk-level provenance;
3. OCR only when native text quality is insufficient;
4. section-aware civic chunking;
5. explicit gibberish/quality detection;
6. source-specific adapters;
7. reproducible extraction audit history.

The current CivicPath working copy already includes the first OCR/Office/FileStack layer. The next implementation should be **civic chunking + page-level citations + language/gibberish quality checks**, not importing the entire Open India Law corpus or its court scrapers.

## Implemented in this working copy

The recommended layer has now been added:

- `src/services/civicChunker.js` detects civic sections and creates bounded chunks.
- Extracted documents return `pages` and provenance-rich `chunks`.
- Source records persist pages, chunks, extraction method, language signal, Devanagari ratio, replacement-character ratio, and legacy-font suspicion.
- Gemini receives `sourceId`, `chunkId`, page range, section type, priority, and text rather than an arbitrary first-text slice.
- Gemini may return evidence anchors, but the backend validates each anchor against stored source chunks before saving it.
- Workflow graph nodes now expose validated evidence anchors.
- `MAX_GEMINI_CHUNKS_PER_SOURCE` bounds prompt growth.
- The suite now has **22 passing tests**, including civic section detection, chunk offsets, and legacy-font rejection.
