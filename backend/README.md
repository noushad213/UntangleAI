# CivicPath Maharashtra — Backend

Turns a natural-language civic request into a **source-grounded, verified workflow**:

```
NL query → normalized issue → official source discovery (Tavily)
→ source retrieval (HTTPS, SSRF-safe) → AI extraction (Gemini, grounded only
in fetched text) → structural + graph validation → cached, graph-ready JSON
```

## Stack
Node.js · Express · MongoDB/Mongoose · Google GenAI SDK (Gemini) · Tavily · Cheerio · pdf-parse · LibreOffice/Tesseract OCR · civic chunking · optional FileStack

## Setup

```bash
npm install
cp .env.example .env   # fill in MONGO_URI, GEMINI_API_KEY, TAVILY_API_KEY
npm run dev             # or: npm start
npm run dev:watch       # opt in to source-file restart during development
npm test                # runs unit tests (no live external calls)
node src/data/seed.js   # loads 3 sample Maharashtra municipalities + issue catalogs
```

PDF sources are supported through the bundled `pdf-parse` dependency. See
`EXTRACTION_PIPELINE_REPORT.md` for the quality gate, alternate official-document
fallback, optional browser rendering, and provenance design.

Import/export queries use separate DGFT and Customs searches across India.
Queries that also mention selling goods include GST and local shop-registration
searches. Each authority gets a bounded share of the source budget; search and
extraction use explicit official-domain allowlists with the existing HTTPS,
DNS, redirect, and evidence checks. Other civic queries retain municipal scope.
These search topics do not establish which registrations apply to an applicant.

For broader free local extraction, install `tesseract-ocr`, `poppler-utils`, and
`libreoffice`. The backend can then OCR scanned PDFs/images and normalize common
DOC/DOCX/XLS/XLSX/PPT/PPTX/ODF files to text. Conversion is bounded and the result
still passes the source-quality gate before Gemini.

Extracted documents are also divided into bounded civic chunks such as
`eligibility`, `documents_required`, `procedure`, `fees`, `deadline`, and
`appeal_grievance`. Chunks retain page ranges and are supplied to Gemini with
their source IDs. Gemini evidence anchors are checked against backend-owned
chunks before appearing in the graph response.

## Project layout

```
src/
├── server.js         entrypoint: connect DB, start Express
├── app.js            express app assembly, middleware, route mounting
├── config/db.js       mongoose connection
├── models/            Municipality, Source, Workflow
├── routes/            health, municipalities, workflows, query
├── controllers/       thin HTTP layer — no business logic
├── services/
│   ├── gemini.service.js       intent classification + workflow extraction
│   ├── search.service.js       Tavily discovery (candidates only, not trusted)
│   ├── extraction.service.js   SSRF-safe multi-strategy HTML/PDF extraction + quality gate
│   ├── civicChunker.js          civic section detection + page-aware provenance chunks
│   ├── filestack.service.js    optional FileStack document-normalization fallback
│   ├── municipality.service.js
│   └── workflow.service.js     orchestration, MongoDB-first caching, API budget
├── validators/         request validation + workflow structural/graph validation
├── utils/              errors, logger, SSRF guard, error-handling middleware
└── data/               sample seed data
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness + DB connection state |
| POST | `/api/municipalities` | create a municipality |
| GET | `/api/municipalities` | list municipalities |
| GET | `/api/municipalities/:slug` | get one municipality |
| POST | `/api/municipalities/:slug/issues` | add an issue to its catalog |
| POST | `/api/query` | **main entry point** — `{ query, municipalitySlug, forceRefresh? }` |
| GET | `/api/workflows/:id` | get one workflow (graph-ready JSON) |
| GET | `/api/workflows/municipality/:municipalityId` | list a municipality's workflows |
| POST | `/api/workflows/:id/verify` | mark `needs_review` → `verified` |

### `POST /api/query` example

```json
{ "query": "how do I pay my property tax", "municipalitySlug": "pune" }
```

Response: `{ classification, fromCache, workflow: { nodes, edges, conflicts, missingInformation, ... } }`
— ready for React Flow on the frontend.

## Design notes / guardrails already built in

- **API budget**: `workflow.service.js` always checks MongoDB (`getCachedWorkflow` /
  `getCachedSource`) before calling Tavily or Gemini.
- **SSRF protection**: `utils/urlSecurity.js` enforces HTTPS, domain allowlisting,
  resolves DNS and blocks private/reserved/link-local/cloud-metadata IPs, and
  re-validates every redirect hop.
- **Never trust model JSON blindly**: `validators/workflow.validator.js` checks
  required fields, that every `sourceId`/`dependsOn` reference is real, that the
  step graph has no cycles, and that any step stating a fact carries a source.
- **Never fabricate facts**: Gemini's system instructions require `null` +
  a `missingInformation` note for anything not explicitly present in the source
  text; new workflows always start as `needs_review`, never auto-`verified`.
- Errors are safe, coded (`GEMINI_FAILED`, `NO_RELIABLE_SOURCES`, etc.) and never
  leak stack traces in production.

## Status
MVP scope: 3 seeded municipalities, 3–4 issues each. Phases implemented: 1–4 (Express/Mongo/models/health,
municipality + workflow CRUD, issue catalog + Gemini classification, Tavily search) plus
5–7 (HTML/PDF extraction, Gemini workflow extraction, validation) and 8 (caching). Phase 9
(graph-ready JSON) is done via `toGraphJson`. Phase 10 (frontend integration) is out of scope here.
