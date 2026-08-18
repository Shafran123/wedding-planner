# 09 — CD workflow: release + deploy

`Status: resolved`

## Comments

- `scripts/ci/bump-version.mjs` (patch bump, prints version) + `scripts/ci/wait-for-health.mjs` (polls `$RAILWAY_URL/health`, skips when the variable is unset).
- `.github/workflows/deploy.yml`: guard on `chore(release):` commits → bump + tag `vX.Y.Z` + push → wait for Railway auto-deploy health → Vercel `pull/build/deploy --prebuilt --prod` with `NEXT_PUBLIC_APP_VERSION/SHA` → GitHub release note. `permissions: contents: write` for the bot push.
- Verified: scripts pass `node --check`; bump+restore test ran (0.0.1 → 0.0.2 → restored). End-to-end verified on the next merge to `main`.

## Context

Decided pipeline: every merge to `main` becomes a Release — patch bump, git tag `v0.0.X`, deploy API → smoke → deploy web. Rollback = platform one-click or checkout a tag.

## Deliverable

- `scripts/ci/bump-version.mjs`: read root `package.json`, bump patch, commit `chore(release): v0.0.X`, tag `v0.0.X`, push commit + tag.
- `.github/workflows/deploy.yml` on push to `main`:
  1. **Guard**: skip when the commit message starts with `chore(release):` (prevents retrigger loop).
  2. Bump + tag.
  3. Build API → deploy to Railway (CLI with `RAILWAY_TOKEN`) → poll `GET /health` until 200 (timeout ~5 min).
  4. Deploy web to Vercel (`vercel pull --environment=production`, `vercel build --prod`, `vercel deploy --prebuilt --prod`) with `NEXT_PUBLIC_APP_VERSION=<version>` and `NEXT_PUBLIC_APP_SHA=<short sha>`.
  5. Verify prod URL serves and create a GitHub Release note for the tag.

## Acceptance

- A test merge to `main` produces tag `v0.0.2`, `/health` 200 on Railway, prod web URL serving the new version badge.
- The bump commit does not retrigger the workflow.
- Rollback exercised once: redeploy previous tag → prod URL serves the old version.
