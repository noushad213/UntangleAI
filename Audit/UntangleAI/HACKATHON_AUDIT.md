# UntangleAI hackathon audit

**Audit date:** 2026-09-29  
**Readiness verdict: blocked for a live generated-roadmap demo; ready for a clearly labeled sample-guides walkthrough.** The frontend serves locally (`GET /` returned 200), but its municipalities API returned 503. There is no `backend/.env`, and `MONGO_URI`, `GEMINI_API_KEY`, `TAVILY_API_KEY`, `GROQ_API_KEY`, and `ADMIN_API_TOKEN` were absent from the current process environment. The real generation path therefore could not be exercised end to end. Offline code checks passed; they do not establish live provider availability or factual accuracy.

## Real demo path and dependencies

The active generation flow is `frontend/src/app/api/v1/generate/route.ts` → backend `POST /api/query` (`backend/src/controllers/workflow.controller.js`) → municipality lookup and civic guardrail → catalog/query-router/AI classification → MongoDB workflow cache → Tavily search when uncached → SSRF-checked page/PDF retrieval and extraction → relevance-ranked chunks → Gemini, with Groq fallback → workflow graph/source-ID validation → MongoDB persistence → Next.js workflow lookup and roadmap rendering (`frontend/src/lib/civicpath-api.ts`). Identical simultaneous queries share in-flight work in `backend/src/utils/pending-queries.js`.

The backend process will not start without MongoDB (`backend/src/config/db.js`, lines 4–12; `backend/src/server.js`, lines 10–13). Live uncached generation also needs Tavily and at least one AI provider key. The frontend defaults to `http://localhost:5000`; production must configure `CIVICPATH_API_URL` or `NEXT_PUBLIC_BACKEND_URL`. Municipality records need to be seeded or loaded into MongoDB (`backend/src/data/seed.js`). Nominatim is an external office-search dependency. Document OCR is optional, sends document bytes to OCR.Space after consent, and requires `OCR_SPACE_API_KEY`; local OCR/Office extraction also needs system binaries. OCR and Office-conversion tests skipped because their external binaries were unavailable.

The active document-verification feature is mounted from `backend/src/features/document-verification` by `backend/src/app.js` (line 28). The top-level `UntangleAI-document-verification/` directory is a separate drop-in copy with separate tests and integration instructions; it is not the mounted implementation. The active verifier reports document-type matching only, not authenticity, ownership, tampering, or official acceptance. Sample roadmaps are static frontend data (`frontend/src/data/mock-roadmaps.ts`) and should be introduced as preloaded examples, not as freshly generated or human-verified advice.

## Highest-priority findings

| Priority | Finding and evidence | Trigger and impact | Validation / deadline |
|---|---|---|---|
| **P1 — fix before demo** | **Live path is not configured in this checkout.** MongoDB is a startup requirement (`backend/src/config/db.js:4–12`); generation proxies to the backend (`frontend/src/app/api/v1/generate/route.ts:9–10, 57–62`). | Start the backend or request municipalities without DB/configuration: startup fails or frontend city loading returns 503. The central live flow cannot be demonstrated here. | Confirmed locally (frontend 200, municipalities 503; required env vars absent). Human action: configure/seed a demo environment, then run the smoke flow below. |
| **P1 — fixed** | **A model-provided citation quote could be displayed without matching source text.** Previously the backend checked source/chunk IDs but accepted any quote of at most 600 characters. | A malformed or injected model response could show fabricated quote text beside a real source link, making a claim look directly supported. | Fixed by checking normalized quote text against the selected backend-owned chunk in `backend/src/services/workflow.service.js:1164` using `quoteMatchesText` in `backend/src/validators/workflow.validator.js:104–109`. Regression test added at `backend/tests/workflow.validator.test.js:47–51`. |
| **P1 — fix before demo if factual accuracy is claimed** | **Source IDs alone do not prove each claim.** `backend/src/validators/workflow.validator.js:50–55` accepts a step with factual fields when it has any valid source ID; the quote check only filters displayed evidence. It does not semantically prove that the cited source supports every title, description, fee, deadline, office, or requirement. | A valid graph may retain a plausible but unsupported fact attached to an unrelated source. Generated roadmaps remain `needs_review`; keep that state visible and have a reviewer check the high-impact claims and source passages. | Confirmed validator scope by inspection; factual grounding needs human review and live fixtures. Fix if time remains: require supported evidence per structured fact and test with adversarial model output. |
| **P1 — fixed** | **Sensitive request and retrieved prompt content were written to logs.** `backend/src/services/workflow.service.js` previously logged raw queries and dumped AI inputs with `console.dir`; query-router fallback also logged the raw request. | A citizen includes personal details or a retrieved document contains sensitive data; logs retain it. | Removed raw query/search text and AI-input dumps from logs, and removed raw query logging in `backend/src/services/queryRouter.service.js`. Verified by code review and `git diff --check`; no personal sample data used. |
| **P2 — fix if time remains** | **Document-type expectation is client-selected in the active route.** `backend/src/features/document-verification/controllers/document-verification.controller.js:16–18` falls back to `req.body.expectedDocumentType`; the frontend sends its selected type (`frontend/src/lib/document-verification.ts:62–69`). | A caller changes the multipart field and gets a match against a different expected type. It cannot establish authenticity or government acceptance; the UI must describe only a type match. | Backend unit tests pass, but authorization/requirement binding was not tested. Bind the expected type to a server-resolved workflow requirement before presenting this as requirement verification. |
| **P2 — fix if time remains** | **Generation can outlive the browser proxy timeout.** The proxy aborts at 90 seconds (`frontend/src/app/api/v1/generate/route.ts:62`); client retries after up to 95 seconds (`frontend/src/lib/generate-roadmap.ts:14, 30`); Gemini retries transient errors up to three times (`backend/src/services/gemini.service.js:124–126, 200–217`). | Slow search/provider retries can leave the browser showing a timeout while the server continues; the automatic retry can wait on the same in-flight operation. | Credible risk from configured bounds; no live latency measured. Demo only with warmed, reviewed sample data or a previously successful live request. |

## Fixes made

- Removed raw query and AI-input logging to reduce exposure of personal request details and retrieved text.
- Backend now drops citation quotes that do not occur in the selected source chunk (whitespace-normalized exact substring match). A real source link can remain even when an invalid quote is dropped, so this does not prove semantic support for every claim.
- Generated steps without explicit model uncertainty now display **medium** confidence rather than **high**. This field has no calibration data; `isUncertain` still maps to low. Regression test added in `frontend/tests/civicpath-api.test.cjs`.

## Checks and baseline

Dependencies were absent initially, so baseline test/typecheck commands failed on missing modules. `npm ci` installed the pinned workspace dependencies; it reported **5 advisories (4 high, 1 critical)**. `npm audit` could not retrieve advisory details because the registry audit endpoint was unreachable; no dependency upgrades were attempted.

After fixes:

- Backend: **79 passed, 0 failed, 2 skipped** (`npm run test:backend`). Skips require optional OCR/office-conversion binaries.
- Frontend: **28 passed, 0 failed** (`npm --prefix frontend test`).
- Separate document-verification module: **8 passed, 0 failed** (`npm --prefix UntangleAI-document-verification test`); this does not substitute for the active backend route.
- Frontend TypeScript check: passed (`npm run typecheck:frontend`).
- Frontend lint: passed with an existing missing-dependencies warning at `frontend/src/components/roadmap/RoadmapCanvas.tsx:210` (`isTrackingMode`, `setViewport`).
- Production frontend build: passed (`npm run build:frontend`).
- Local smoke: frontend `/` returned HTTP 200; `/api/v1/municipalities` returned HTTP 503 without the backend. No live AI/search/OCR calls were made; no latency or factual-accuracy benchmark is claimed.
- Browser UI review: not completed. The computer-use browser inventory returned no available browser and the in-app browser was unavailable.

## Adversarial test matrix

| Scenario | Expected behavior | Observed result | Status |
|---|---|---|---|
| Common request: property-tax payment in a configured Maharashtra city | Resolve city and service; generate only from official evidence | Frontend guard accepts representative supported requests; no live backend configured | **Partially tested; end-to-end untested** |
| Ambiguous city/service | Ask user to clarify before generation | Location/generation guard tests cover city ambiguity and vague requests | **Pass (deterministic frontend only)** |
| Unsupported state/jurisdiction | Explain unsupported scope; do not silently use another city | Unit tests reject Delhi/Karnataka/Madhya Pradesh examples | **Pass (frontend guard)** |
| Missing applicant circumstances | Ask for needed facts or show gaps, never assume eligibility | Vague requests clarify; live classification/extraction of a specific eligibility case not run | **Partially tested** |
| Conflicting/incomplete official instructions | Surface conflict and missing information; keep `needs_review` | Rendering/validator paths exist; live conflict fixture not run | **Untested with real retrieval** |
| Direct prompt injection in user request | Ignore instructions to invent facts/change jurisdiction/reveal secrets | No dedicated adversarial prompt test; server passes user text to classifier/extractor | **Untested** |
| Injection embedded in retrieved HTML/PDF/OCR | Treat page/document text as data, not instructions | Prompts constrain extraction and quote anchors are now validated, but no hostile-source fixture was run | **Untested** |
| Malformed/unreadable document | Fail closed, avoid claiming acceptance | Local deterministic type/OCR-adapter tests pass; live OCR provider not configured | **Pass offline; live untested** |
| Provider timeout/quota/network failure | Bounded recovery and clear error, never fake success | Frontend retry/error tests and provider retry-decision tests pass; live providers not exercised | **Pass simulated; live untested** |
| Database outage | Fail visibly and recover; do not masquerade as success | Backend requires MongoDB at startup; local proxy observed 503. No live database failure injection | **Blocked / untested recovery** |
| Repeated/concurrent identical request | Deduplicate in-flight work; return stored workflow after refresh | In-flight deduplication and cache/freshness unit tests pass | **Pass deterministic unit tests; browser refresh untested** |

## Remaining risks and time-boxed preparation

1. **First 20 minutes:** human configures demo MongoDB, seeds the three sample municipalities, sets server-only provider credentials, and confirms frontend/backend URLs and production CORS. Keep secrets out of browser-visible `NEXT_PUBLIC_*` variables except the backend base URL.
2. **Next 15 minutes:** run health and municipality checks, then generate one Pune or Mumbai request from official sources. Inspect each cited page and exact fee/document/deadline claims. Save the successful workflow and mark it reviewed only after human source inspection.
3. **Next 10 minutes:** exercise unsupported-state clarification, refresh the successful workflow URL, verify links open, and confirm the review banner says `needs_review` or names the actual reviewer. Check a narrow mobile viewport and keyboard navigation manually.
4. **Final 5 minutes:** rehearse the script below and confirm sample/live labels and the provider-offline fallback. Do not run bulk warming or live benchmark scripts during the demo.

External blockers are the missing demo database/configuration and the unavailable browser automation surface. Source freshness, real provider quotas, OCR.Space terms/quota, live latency, and jurisdiction-level correctness remain unverified. The audit request's upload/injection, deployment SSRF redirect/DNS behavior, mobile accessibility, and real refresh-during-generation scenarios were not exhaustively tested. `npm ci` security advisories still need a network-enabled audit report and triage; avoid a late `npm audit fix --force`.

## 3–5 minute demo script

1. **0:00–0:30:** State scope plainly: live generation is configured only for the seeded Maharashtra authorities; sample guides are preloaded examples and are not evidence of a fresh source check.
2. **0:30–1:15:** Browse a clearly marked sample (for example, the FSSAI food-licence guide). Open one source and explain that the guide is illustrative and each rule must be checked on the linked official page.
3. **1:15–2:00:** Enter a vague request such as “I need a certificate” and show the clarification instead of invented steps.
4. **2:00–3:30:** If and only if the human smoke test succeeded, generate a Pune property-tax or Mumbai restaurant food-licence roadmap. Open one step, source link, missing-information/conflict panel, and review state; explain one concrete fact by locating it in the source. Otherwise show the sample and do not simulate a live result.
5. **3:30–4:00:** Try an unsupported jurisdiction and show that the app declines live generation rather than substituting Maharashtra guidance. Finish by stating document checks only compare likely document type and do not establish authenticity or acceptance.

**Provider/network fallback:** show the clearly labeled preloaded sample, state that live source retrieval is unavailable, and continue only with supported UI behavior such as clarification and unsupported-location handling. Do not paste preloaded content into a “generated” screen or call it verified.

## Final smoke test and recovery

- Confirm MongoDB and backend health, seeded municipalities, and at least one configured AI provider plus Tavily.
- From the frontend, generate one known request; confirm correct city, source links, review state, and visible missing facts/conflicts.
- Reload the generated URL and open every source used in the demo. Verify the reviewer login and test review only on a roadmap checked against sources.
- Confirm a vague query clarifies and an unsupported city is rejected. Do not upload real identity documents during the demo.
- If the backend/provider fails, stop live generation, show labeled sample content, and identify the failure honestly. If a bad roadmap was cached, avoid repeated forced refreshes; request an authorized refresh after fixing the source/provider issue, then inspect it again. Keep a copy of the last known-good demo workflow URL and revert local fixes with the workspace's normal version-control workflow if a regression appears.

## Post-hackathon roadmap (user value first)

1. Enforce claim-level evidence: validate each fee, deadline, requirement, eligibility, and office statement against source passages; reject or mark unsupported claims.
2. Bind document type checks to a server-resolved workflow requirement; retain consent and show the explicit type-only scope.
3. Add deterministic hostile-query and hostile-source fixtures, malformed provider JSON tests, and real DB/provider failure recovery tests.
4. Measure stage latency and add cancellation/deadline budgets so client, proxy, and provider retry windows agree.
5. Triage the lockfile advisories, then improve portal-specific extraction, freshness monitoring, and calibrated confidence based on measured evidence.
