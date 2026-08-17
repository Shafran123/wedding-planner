# 08 — Firebase prod hardening

`Status: ready-for-human` (paste step) — remainder agent-executable
`Blocked by:` none; must land before 09.

## Comments

- **Decision (user): reuse the existing service account** (`wedding-planner-dae2b-firebase-adminsdk-fbsvc-dea326c1a8.json`) — no console work needed.
- The compact one-line JSON for the Railway `FIREBASE_SERVICE_ACCOUNT_JSON` env var has been prepared at `/var/folders/y8/qmx8c9rs4mx7sgn0yww5fzpr0000gn/T/opencode/railway-env/firebase-service-account-json.txt` (kept out of the repo). Paste its contents into Railway during ticket 07 provisioning.
- Storage rules deploy + prod CORS check remain after Railway/Vercel exist.

## Context

Prod must not reuse the local dev service account. Decided: **reuse the existing Firebase project** (`wedding-planner-dae2b`) for prod.

## Deliverable

- Human: in the Firebase console create a **new restricted service account** (Firebase Admin SDK, token-verification scope only — this app uses no Firestore/Storage admin APIs), download the JSON.
- Agent: convert JSON to `FIREBASE_SERVICE_ACCOUNT_JSON` and set it on Railway (ticket 07); do **not** commit it (the `firebase/*.json` gitignore already covers this).
- Deploy the Firebase Storage security rules (`firebase/storage.rules`) via CLI if not already applied.
- Verify `CORS_ORIGIN` on the API allows only the prod web URL (plus localhost for dev).

## Acceptance

- Prod API verifies Firebase tokens using the restricted account.
- Storage rules deployed; uploads from prod web origin succeed.
- The restricted account JSON never appears in git history.
