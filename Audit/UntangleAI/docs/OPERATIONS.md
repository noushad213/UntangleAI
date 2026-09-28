# Operations runbook

## Required configuration

Backend:

- `MONGO_URI`
- `GEMINI_API_KEY`
- `TAVILY_API_KEY`
- `ADMIN_API_TOKEN`: long random secret used only by trusted server processes
- `ADMIN_REVIEWER_ID`: reviewer identity recorded on verification
- `CORS_ALLOWED_ORIGINS`: comma-separated frontend origins

Frontend server:

- `CIVICPATH_API_URL`: private backend base URL
- `ADMIN_API_TOKEN`: same backend administrator token; never prefix it with `NEXT_PUBLIC_`
- `ADMIN_DASHBOARD_USER` and `ADMIN_DASHBOARD_PASSWORD`: internal review-area credentials
- `NEXT_PUBLIC_DEFAULT_MUNICIPALITY_SLUG`: seeded municipality used until the location picker is connected

Serve both applications over HTTPS. Do not expose `/admin` without replacing HTTP Basic authentication with the deployment identity provider.

## Deployment gate

Run from the repository root:

```bash
npm run test:backend
npm run typecheck:frontend
npm run lint:frontend
npm run build:frontend
```

Confirm `/api/health` reports `ok`, submit one supported task, inspect its sources, and verify it through `/admin` before shifting traffic.

## Workflow freshness

`WORKFLOW_FRESHNESS_MS` defaults to seven days. A stale workflow is marked `outdated` and regenerated on the next matching query. Reviewers must inspect changed evidence before marking it reviewed again.

## MongoDB backup and restore

Production must use automated encrypted snapshots with a target recovery point of 24 hours and a target recovery time of four hours.

Monthly restore check:

1. Restore the newest snapshot into an isolated database.
2. Compare municipality, source, and workflow document counts with production.
3. Open one restored workflow and confirm its source and graph references resolve.
4. Record the restore duration and any missing data.
5. Delete the isolated restore after the check according to the hosting provider's retention policy.

Never test a restore over the production database.

## Rollback

Keep the prior frontend and backend release artifacts until the new release passes the smoke test. Roll back application versions before changing data. The current schema changes are additive; if a future release changes stored documents, ship a versioned migration and a tested reverse migration.

## Incident checks

- High 429 rate: inspect caller IP distribution and lower concurrency before raising limits.
- Source extraction failures: check allowlisted domains, DNS resolution, response size, and optional OCR tools.
- Model failures: serve an existing fresh reviewed workflow when available; do not label an unreviewed fallback as reviewed.
- Suspected administrator token leak: rotate `ADMIN_API_TOKEN`, restart both services, and review verification timestamps.
