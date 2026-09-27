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
- `npm run build:frontend` — Production build for the Next.js app
- `npm run test:backend` — Run backend test suite (22 unit tests)
