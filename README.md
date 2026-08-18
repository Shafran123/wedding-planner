# Wedding Planner

**Plan your wedding. Track every detail. Enjoy the journey.**

A full-stack wedding planning application: budgets, tasks, vendors, locations, events, notes, collaboration and a live dashboard — in one calm, premium workspace for couples.

## Stack

| Layer      | Technology                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| Frontend   | Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn-style UI, RHF + Zod, SWR, Recharts, date-fns |
| Backend    | Node.js, Express, TypeScript                                               |
| Database   | MongoDB (Mongoose)                                                         |
| Auth       | Firebase Authentication (email/password + Google; phone/SMS-ready)         |
| Files      | Firebase Storage, scoped to `weddings/{weddingId}/...`                      |

Monorepo (npm workspaces):

```
apps/web            Next.js frontend
apps/api            Express API
packages/shared     shared types, zod schemas, enums, constants
docs/adr            architecture decision records
.scratch            issue tracker + spec + tickets
```

## Prerequisites

- Node 20+
- MongoDB running locally (`brew install mongodb-community && brew services start mongodb-community`) — or any MongoDB URI
- A Firebase project (see below)

## Firebase setup

1. Create a project at https://console.firebase.google.com
2. **Authentication → Sign-in method**: enable Email/Password and Google. (Phone can be enabled later — the auth layer is provider-agnostic.)
3. **Storage**: create a Storage bucket and deploy the rules in `storage.rules` (`firebase deploy --only storage`).
4. **Service account** for the API: Project settings → Service accounts → generate a new private key (JSON).
5. Configure environment variables:

**`apps/api/.env`**

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/wedding-planner
CORS_ORIGIN=http://localhost:3000
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/service-account.json
# or FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

**`apps/web/.env.local`** — copy from `apps/web/.env.example` and fill in the web app config from Firebase → Project settings → Your apps.

## Running

```bash
npm install
npm run dev          # API on :4000, web on :3000
```

Open http://localhost:3000 → create an account → onboarding creates your wedding with default budget/task categories and a smart task checklist generated from your wedding date.

## Testing

```bash
npm test             # Vitest: domain logic + API integration tests (needs MongoDB running)
npm run typecheck    # both apps + shared package
npm run lint         # web + api
```

Tests mock only the Firebase token-verification boundary; everything else runs against a real MongoDB (`wedding-planner-test` database).

## Architecture notes

- **One seam**: all business logic lives in pure modules inside the API (`src/domain/`): money math (integer minor units, see ADR-0003), countdown, planning progress, task deadline windows, template generation. The web app only renders and formats.
- **Roles**: owner / partner / planner / viewer, enforced in API middleware; viewers are read-only, planners manage tasks/vendors/events, partners manage all data, owners also manage members and settings.
- **Soft delete** (`deletedAt`/`deletedBy`) for expenses, payments, vendors, notes — removed from all queries and totals, kept for records.
- **Payments are the ledger**: marking a payment paid recomputes the linked expense's payment-status snapshot and writes an activity entry.
- **Notifications**: in-app only for now; the notification table is FCM/email-ready.

## Deploying

```
Browser ──► Vercel (web, apps/web) ──► Railway (API, apps/api) ──► MongoDB Atlas M0
                  │                           │
                  └─────────────── Firebase Auth + Storage (shared project)
```

### Pipeline

- **Every PR**: GitHub Actions (`ci.yml`) runs lint, typecheck, build, and tests (MongoDB service container). Runtime tests stay local-only.
- **Every merge to `main`**: `deploy.yml` bumps the patch version (root `package.json`), commits `chore(release): vX.Y.Z`, tags `vX.Y.Z` (rollback points), waits for Railway's auto-deploy to report healthy at `/health`, deploys the web to Vercel with the version injected, and publishes a GitHub release.
- **Versioning**: single source of truth is root `package.json`. The webapp shows `vX.Y.Z · Beta` in the sidebar footer and `vX.Y.Z+<sha>` in Settings → About. The API reports it on `/health`.
- **Rollback**: redeploy a previous tag on the platform, or `git checkout vX.Y.Z` + redeploy. Vercel/Railway also offer one-click "rollback to previous deploy".

### Environment variables

| Where | Variable | Notes |
| --- | --- | --- |
| Railway (API) | `MONGODB_URI` | Atlas URI **with database name**, e.g. `mongodb+srv://user:pass@cluster…/wedding-planner` |
| Railway | `CORS_ORIGIN` | The Vercel app URL (comma-separated list supported) |
| Railway | `FIREBASE_SERVICE_ACCOUNT_JSON` | One-line service-account JSON; never commit |
| Railway | `NODE_ENV` | `production` — set it as **deploy-only** so builds keep devDependencies |
| Vercel (web) | `NEXT_PUBLIC_API_URL` | The Railway URL, e.g. `https://<service>.up.railway.app` |
| Vercel | `NEXT_PUBLIC_FIREBASE_*` | 6 web-config keys from the Firebase console |
| GitHub Secrets | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RAILWAY_TOKEN` | CI deploys |
| GitHub Variables | `RAILWAY_URL` | Enables the API health gate: `gh variable set RAILWAY_URL <url>` |

### Backup and restore (manual, monthly)

```bash
mongodump --uri "mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/wedding-planner" --out backup-$(date +%F)
# restore:
mongorestore --uri "mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/wedding-planner" backup-YYYY-MM-DD/
```

### Prod smoke test

```bash
PROD_URL=https://<app>.vercel.app PROD_API_URL=https://<api>.up.railway.app \
  node scripts/e2e/prod-smoke.mjs
# cleanup throwaway users/weddings afterwards:
FIREBASE_SERVICE_ACCOUNT_JSON='<json>' MONGODB_URI='<atlas uri>' \
  node --import tsx scripts/ci/cleanup-prod-users.mjs
```

### Adding a custom domain or a pre-prod environment later

- **Domain**: add it in Vercel + Railway, update `CORS_ORIGIN` and `NEXT_PUBLIC_API_URL`, redeploy.
- **Pre-prod**: duplicate the Railway service and Atlas cluster under a staging project, add a `preview` Vercel environment with its own `NEXT_PUBLIC_API_URL`, and give it a **separate Firebase project** so auth data doesn't mix with prod.

## Roadmap (deferred)

Drag-and-drop timeline editing · keyboard shortcuts · Arabic UI (i18n-ready) · PDF exports · AI assistant (data-grounded) · guest management/RSVP/seating · vendor marketplace · SaaS billing · FCM push · calendar week/day views · seed scripts.

## Domain docs

`CONTEXT.md` (glossary), `docs/adr/` (0001 MongoDB, 0002 Firebase Auth, 0003 integer minor units, 0004 hosting architecture), and specs + tickets in `.scratch/`.
