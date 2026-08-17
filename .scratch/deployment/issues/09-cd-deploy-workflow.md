# 09 — CD workflow: release + deploy

`Status: ready-for-agent`
`Blocked by:` 01, 03, 04, 05, 07, 08.

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
