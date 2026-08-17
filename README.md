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

- Web: Vercel (`NEXT_PUBLIC_API_URL` → your API origin, Firebase web vars set in Vercel).
- API: any Node host; set `MONGODB_URI`, `CORS_ORIGIN`, and the Firebase service-account env vars. Never ship `serviceAccount.json`; never commit secrets.
- Before production: deploy `storage.rules`, review CORS origin, remove development data.

## Roadmap (deferred)

Drag-and-drop timeline editing · keyboard shortcuts · Arabic UI (i18n-ready) · PDF exports · AI assistant (data-grounded) · guest management/RSVP/seating · vendor marketplace · SaaS billing · FCM push · calendar week/day views · seed scripts.

## Domain docs

`CONTEXT.md` (glossary), `docs/adr/` (0001 MongoDB, 0002 Firebase Auth, 0003 integer minor units), and the spec + tickets in `.scratch/wedding-planner/`.
