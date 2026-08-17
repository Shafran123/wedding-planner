# 07 — Provision cloud infrastructure

`Status: ready-for-human` (console steps need the owner's accounts)
`Blocked by:` 01 (platforms import the GitHub repo), 03 (Railway needs the start path).

## Context

Nothing exists in the cloud yet. Decided: Atlas M0 (AWS Bahrain), Railway (API), Vercel (web), platform URLs only.

## Deliverable — ordered checklist

**MongoDB Atlas**
- Create M0 cluster, region **AWS Bahrain (me-south-1)**.
- Create DB user (scram) + allow connections from anywhere (`0.0.0.0/0` — Railway egress isn't a fixed range).
- Produce the connection string (`mongodb+srv://…/wedding-planner`).

**Railway (API)**
- New project, deploy from GitHub repo; set service root dir `apps/api`, start command per ticket 03.
- Env: `MONGODB_URI`, `CORS_ORIGIN` (the Vercel app URL, to be filled at the Vercel step), `FIREBASE_SERVICE_ACCOUNT_JSON` (ticket 08), `NODE_ENV=production`.
- Healthcheck path `/health`.

**Vercel (web)**
- Import the GitHub repo; root dir `apps/web`; keep **preview deploys on PRs**, disable production auto-deploy (the CD workflow deploys prod, ticket 09).
- Env: `NEXT_PUBLIC_API_URL` (Railway URL), all `NEXT_PUBLIC_FIREBASE_*` from the existing project's web config.

**GitHub Secrets**: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RAILWAY_TOKEN`.

## Acceptance

- Railway URL `GET /health` → 200.
- A Vercel preview deploy renders the login page and can call the API without CORS errors.
- Manual test: login works against prod API + Atlas data.
