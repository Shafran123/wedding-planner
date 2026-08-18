# 08 — Tests, docs, version bump

`Status: resolved`

`Blocked by: 02, 05, 06, 07`

## Context

Close-out ticket: cover the new behavior with tests, update docs, bump the version for release.

## Deliverable

- Unit tests for the money-normalization helper and re-denomination math (rounding, rate fallback, base-currency passthrough).
- API tests for: LKR expense/payment/vendor/task/location create+patch snapshots; `wedding.rates` update; budget totals using base sums; currency change with/without rate; category rename/delete/duplicate/in-use rules.
- Playwright coverage for: LKR expense entry with prefilled rate → dual display → totals in base; Settings categories add/rename/delete/lock.
- Update `docs/` (AGENTS-adjacent domain docs, CONTEXT.md glossary terms: currency, base currency, snapshot rate) and `docs/adr/` if warranted.
- Bump app version (root `package.json` + wherever the version string is derived) 0.0.x → 0.1.0.

## Acceptance

- `pnpm test` / `pnpm typecheck` / lint all green in CI.
- Smoke against a deployed preview: LKR expense flows end-to-end; category rename visible on an item.

## Comments

- Implemented on `feature/multi-currency-categories`; lint, typecheck and tests green.
