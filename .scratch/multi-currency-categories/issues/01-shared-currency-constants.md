# 01 — Shared currency constants

`Status: ready-for-agent`

## Context

Multi-currency scope is AED + LKR only (spec D1). `packages/shared/src/constants.ts` currently lists 11 currencies; the `CurrencyCode` type derives from it.

## Deliverable

- Reduce `CURRENCIES` to AED and LKR (keep `label`/`symbol` shape; LKR label "Sri Lankan Rupee", symbol "Rs").
- `CurrencyCode` becomes `"AED" | "LKR"` automatically via the constant.
- Grep for other hardcoded currency lists/options and align: onboarding page, settings page render `CURRENCIES` already — no change needed there beyond the constant.
- Ensure `DEFAULT_CURRENCY` stays `"AED"`.

## Acceptance

- `pnpm typecheck` clean across apps and packages.
- Onboarding and Settings currency selects show exactly AED and LKR.
