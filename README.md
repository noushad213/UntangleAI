# UntangleAI

Turn confusing government processes into clear, personalized step-by-step roadmaps.

## Monorepo Structure

```
UntangleAI/
├── frontend/          # Next.js 14 web application (React Flow, multi-language, document vault)
├── backend/           # Node.js Express backend (CivicPath engine, Tavily discovery, Gemini/Groq extraction)
├── package.json       # Monorepo scripts for running and testing both workspaces
└── README.md
```

## Quick Start

### 1. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Runs the Next.js development server at `http://localhost:3000`.

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Set MONGO_URI, GEMINI_API_KEY, TAVILY_API_KEY (and optional GROQ_API_KEY)
npm run dev
```

Runs the CivicPath Express backend at `http://localhost:5000`.

To run backend unit tests:
```bash
npm run test:backend
```

### 3. Root Workspace Commands

From the project root:
- `npm run dev:frontend` — Start Next.js development server
- `npm run dev:backend` — Start Express development server
- `npm run dev:backend:watch` — Restart Express when backend source files change
- `npm run build:frontend` — Production build for the Next.js app
- `npm run test:backend` — Run backend tests
- `npm --prefix frontend test` — Run frontend logic tests

The default backend command keeps running while files are edited, so roadmap
requests are not interrupted by automatic restarts. Restart it manually after
backend changes, or use `dev:backend:watch` while developing.

## Office maps, forms and civic helplines

Open a roadmap step to find its office on a map, open form links, prepare an
editable cover letter, or check municipal helplines. Cover letters are drafts;
use the prescribed government form when required. Applicant details stay in
browser memory and are never cached or sent to the backend.

These features port the `geo_tags` and `doc_generator` work from `divya-work`
(`938d0de`) into the existing workspaces. The standalone servers and applicant
caches were replaced. Documents come from roadmap requirements; fees, deadlines,
legal references and office addresses are not inferred from keywords.

`POST /api/offices/lookup` accepts `{ "query": "office name and city" }`.
The frontend proxies this through `/api/v1/offices`. Results are map matches,
not verified jurisdiction assignments. An empty match list asks the user to
check the official service page; it never substitutes a default city.

The default geocoder uses [Nominatim](https://operations.osmfoundation.org/policies/nominatim/):
only user-triggered public office searches, no autocomplete, at most one
provider request per second per backend process, a bounded 24-hour result cache,
and OpenStreetMap attribution. Do not search personal addresses. Configure
`GEOCODING_BASE_URL` and `GEOCODING_USER_AGENT` for another Nominatim-compatible
provider. Deployments with multiple backend replicas must use a shared provider
limiter or a separately hosted geocoder.

Helplines are authority-specific and link to their official sources. The directory
currently covers BMC, PMC, Nagpur NMC, MCD and GBA. Other authorities use their official contact
pages rather than guessed phone numbers, office hours or WhatsApp contacts.
