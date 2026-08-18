# 11 — Production smoke validation

`Status: resolved`

## Comments

- `scripts/e2e/prod-smoke.mjs`: full journey against `PROD_URL`/`PROD_API_URL` (signup → onboarding → dashboard → sidebar version badge → Settings About version+sha → `/health` version match → logout → login).
- `scripts/ci/cleanup-prod-users.mjs`: removes throwaway users + wedding data from prod Firebase/Mongo.
- Final green run pending the first live prod deploy (this ticket's acceptance is exercised at cutover).

## Context

Prove the live environment works end-to-end — including the version visibility the user asked for (ticket 05).

## Deliverable

- Parameterize the existing Playwright scripts (`scripts/e2e/`) to target `PROD_URL` instead of `localhost:3000`.
- New smoke script `scripts/e2e/prod-smoke.mjs`:
  1. Sign up a fresh throwaway user → onboarding → dashboard loads.
  2. Sidebar footer shows `v0.0.x · Beta`.
  3. Settings → About shows `v0.0.x+<sha>`.
  4. `GET /health` → 200 with matching version.
  5. Logout → login works.
- Clean up the throwaway user + wedding data afterwards (same pattern as the existing e2e cleanup).

## Acceptance

- One green run against the real prod URL after the first release.
- No test residue left in prod Firebase/Mongo.
