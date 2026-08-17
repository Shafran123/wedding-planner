# 06 — CI workflow: PR checks

`Status: resolved`

## Comments

- `.github/workflows/ci.yml`: pull_request + push to main → lint, typecheck, build (web + api), vitest suite against a `mongo:7` service container (test DB is hardcoded to 127.0.0.1:27017, so no code change). Runtime tests (real Firebase creds) stay local-only, noted in a workflow comment.
- Verified: first run on `main` passed end-to-end.

## Context

Decided (Q4): GitHub Actions is the pipeline. Every PR must be gated before it can merge.

## Deliverable

`.github/workflows/ci.yml` on `pull_request` and `push` to `main`:

1. Node 22 LTS setup (Next 16 requires ≥20.9), `npm ci` (cache).
2. `npm run lint` → `npm run typecheck` → `npm run build` (web + api).
3. Unit + integration tests: `npm run test -w @wedding/api` with a **MongoDB service container** (`mongo:7`, port 27017) — the test DB is hardcoded to `127.0.0.1:27017`, so no code change needed.
4. Skip `test:runtime` in CI (needs a real Firebase service account) — note this in a workflow comment.

## Acceptance

- Workflow runs on a PR and is green end-to-end.
- A deliberately failing lint/typecheck/test turns the check red.
