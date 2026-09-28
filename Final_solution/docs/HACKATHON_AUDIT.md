# UntangleAI pre-demo audit

**Reviewed:** 2026-09-29
**Checkout:** `noushad` branch, based on `f90be0a` at review time
**Scope:** source review and local automated checks; no deployment

## Fixes applied

- **Evidence grounding:** generated quotes are now kept only if the normalized quote appears in the exact retrieved chunk. Legacy extracted-text sources are included. Structured requirements without grounded quotes are cleared and marked uncertain; the workflow exposes the verification gap.
- **Roadmap loading:** generated-roadmap fetch failures now show a temporary service error and retry link. A genuine API 404 still renders the not-found page.
- **Empty source allowlists:** Tavily discovery and URL extraction now default to `gov.in` and `nic.in` when a municipality has no configured domains. Configured municipal domains remain supported. Catalog/pre-ingested sources still rely on their trusted source selection path.
- **OCR secret handling:** the standalone feature now ignores `.env` while keeping `.env.example` trackable.

## Verification and limits

- The full backend suite ran **79 passed, 2 failed, 2 skipped**. Both failures are in the existing document-verification route tests and are caused by missing installed `multer`; dependency installation was declined. Audit-specific evidence and allowlist tests passed.
- `git diff --check`: passed.
- Frontend dependencies are unavailable in this checkout, so frontend tests, typecheck, lint, build, and browser smoke test could not be run.
- No live MongoDB, Gemini/Groq, or Tavily credentials were configured, so live generation and service behavior remain unverified.
- OCR document classification is heuristic and does not authenticate a document. Review provider data handling and consent before using real identity documents.
- Curated or pre-ingested source records still need human review for source trust and correct municipality/service mapping.
