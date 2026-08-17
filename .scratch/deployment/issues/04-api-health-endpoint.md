# 04 — API health endpoint

`Status: resolved`

## Comments

- Upgraded the existing minimal `/health` stub in `app.ts` (mongo readyState check, version from `apps/api/package.json`, `APP_SHA` env, firebase env check; 503 when degraded).
- Bundle verified live: `{"status":"ok","version":"0.1.0","sha":"unknown","mongo":"up","firebase":"missing"}` (firebase shows missing locally without service-account env — prod sets `FIREBASE_SERVICE_ACCOUNT_JSON`).
- +2 integration tests (200/503 paths); suite now 43 passing.
`Blocked by:` 03 (the endpoint is exercised via the production start path).

## Context

The deploy pipeline needs a readiness probe: Railway healthchecks and the post-deploy Smoke Test (ticket 11) both poll it. Nothing like it exists today.

## Deliverable

- `GET /health` (public, no auth) responding:
  - `200` → `{ status: "ok", version: "<api package.json version>", sha: "<env APP_SHA or unknown>", mongo: "up", firebase: "configured" }`
  - `503` → same shape with `status: "degraded"`, `mongo: "down"` when the Mongo connection is not ready.
- Reads version from `apps/api/package.json` (same source the bump script updates).

## Acceptance

- `curl localhost:4000/health` → 200 with correct version while Mongo is up.
- With Mongo stopped → 503, `mongo: "down"`.
- Unit test covering both responses.
