# Spec: End-to-end deployment pipeline

**Slug**: `deployment` · **Author**: agent + user · **Date**: 2026-08-17

## Goal

Ship the wedding planner to production: a hosted web app, API, and database with an automated GitHub pipeline (checks on every PR, Release + Deployment on every merge to `main`), rollback capability, and a **visible version in the webapp** (the app has never shown one).

## Non-goals

- No pre-prod environment (decided: prod only; Vercel previews cover review).
- No custom domain (`*.vercel.app` + `*.up.railway.app` for now).
- No migration framework, no automated backups (manual monthly dump documented).
- No Docker/containerization (PaaS deploys only).
- No load testing or autoscaling beyond platform defaults.

## Architecture

```
Browser
  │  https://<app>.vercel.app            (Vercel — Next.js, apps/web)
  ▼
Vercel (web)
  │  https://<api>.up.railway.app        (NEXT_PUBLIC_API_URL)
  ▼
Railway (API — Express, apps/api, node dist/index.js)
  │  MONGODB_URI (Atlas M0, AWS Bahrain)
  ▼
MongoDB Atlas M0

Firebase Auth (existing project wedding-planner-dae2b) — used by web (public keys) and API (restricted service account)
```

### Environment variable inventory

| Where | Variables |
| --- | --- |
| Vercel (web) | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FIREBASE_API_KEY/AUTH_DOMAIN/PROJECT_ID/STORAGE_BUCKET/MESSAGING_SENDER_ID/APP_ID`, `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_APP_SHA` (build-time, set by CI) |
| Railway (API) | `MONGODB_URI`, `CORS_ORIGIN` (the vercel.app URL), `PORT` (platform), `NODE_ENV=production`, `FIREBASE_SERVICE_ACCOUNT_JSON` (restricted service account) |
| GitHub Secrets | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RAILWAY_TOKEN` |

## Versioning (explicit user requirement)

- Single source of truth: root `package.json` `version`, starting at **0.0.1**.
- Every deploy to prod bumps the patch (`0.0.1 → 0.0.2`) and creates git tag `v0.0.2`.
- Webapp shows **`v0.0.2 · Beta`** in the sidebar footer, and **`v0.0.2+<short-sha>`** plus environment in Settings → About.
- API `/health` reports version + sha + dependency status.
- "Beta" label stays until the user declares otherwise.

## Pipeline

**On every PR** (`ci.yml`):
`lint → typecheck → build (web + api) → unit + integration tests (MongoDB service container on 127.0.0.1:27017)`. Runtime tests (real Firebase credentials) stay local-only.

**On merge to `main`** (`deploy.yml`), guarded against retrigger loops:
1. Bump patch version → commit `chore(release): v0.0.X` → tag `v0.0.X` → push.
2. Build API → deploy to Railway → poll `GET /health` until 200.
3. Deploy web to Vercel with `NEXT_PUBLIC_APP_VERSION/SHA` → verify prod URL.
4. GitHub Release note with the version. Rollback = platform one-click or checkout tag + redeploy.

## First deploy (cutover) order

1. Push repo to GitHub (ticket 01), auth platforms.
2. Fix lint + API production start path (02, 03).
3. Provision Atlas M0 → Railway → Vercel with env vars (07, 08).
4. Land CI + CD workflows (06, 09).
5. Merge to main → first Release `v0.0.1` → smoke test prod incl. visible version (11).
6. Document runbook + backup command (10).

## Decisions log (grilling outcomes)

| # | Decision | Answer |
| --- | --- | --- |
| Q1 | Hosting | Vercel (web) + Railway (API) + Atlas M0 + Firebase |
| Q2 | Environments | Prod only for now |
| Q3 | Domain | Vercel platform URL |
| Q4 | CI/CD | GitHub Actions pipeline |
| Q5 | Versioning | `v0.0.1` start, Beta badge, auto patch per deploy, full `v0.0.1+<sha>` in About |
| Q6 | Version placement | Sidebar footer + Settings → About |
| Q7 | Scale | You + close circle (<100 users) |
| Q8 | Secrets | Platform-native env vars + GitHub Secrets |
| — | Firebase | Reuse existing project for prod |
| — | Atlas | M0 free, AWS Bahrain region |
| — | Backups | Manual monthly `mongodump`, documented |
| — | Rollback | Platform + git tags on every deploy |

## Known blockers (→ tickets)

1. Repo empty on GitHub, no git remote, `gh` unauthenticated → 01.
2. Lint gate fails (`react-hooks/refs` in `apps/web/contexts/auth.tsx` + 3 warnings) → 02.
3. API has no production start path (`@wedding/shared` ships raw TS, no `start` script) → 03.
4. Zero infra: no CI/CD, no Dockerfiles/compose, no platform configs → 06, 07, 09.
5. No `/health` endpoint → 04.
6. No version surfaced anywhere → 05.

## Acceptance criteria

- [ ] `gh`-pushed repo with green CI on PRs; runtime tests documented as local-only.
- [ ] Merge to `main` → auto tag + prod deploys, `/health` 200, version bump visible.
- [ ] Prod smoke test green: sign up → onboarding → dashboard; footer shows `v0.0.1 · Beta`; Settings → About shows `v0.0.1+<sha>`.
- [ ] README runbook: first-deploy order, rollback, backup command, env inventory.
- [ ] Rollback exercised at least once (redeploy previous tag).
