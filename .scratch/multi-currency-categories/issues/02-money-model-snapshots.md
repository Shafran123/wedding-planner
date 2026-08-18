# 02 — Money model: per-record currency, rate, base snapshots

`Status: ready-for-agent`

`Blocked by: 01`

## Context

Every money-bearing record gains `currency`, `rate`, and base-snapshot fields; the server computes base = round(minor × rate) (spec D3/D5/D6/D7). Totals switch to base fields.

## Deliverable

- Shared schemas (`packages/shared/src/schemas.ts`): expense/payment/vendor/task/location create+patch schemas accept optional `currency` (`z.enum(["AED","LKR"])`) and `rate` (non-negative number, optional).
- Models (`apps/api/src/models/`): add `currency` (String, default `"AED"`), `rate` (Number, default 1), and base snapshot fields per the spec table (Expense `baseEstimatedMinor`/`baseActualMinor`, Payment `baseAmountMinor`, Vendor `basePriceMinor`, Task `baseEstimatedCostMinor`/`baseActualCostMinor`, Location `baseEstimatedCostMinor`/`baseActualCostMinor`). Wedding model gains `rates: { type: Map, of: Number, default: {} }` keyed by currency code.
- A shared money-normalization helper (e.g. `apps/api/src/domain/currency.ts`): given `{ minor, currency, rate }` + wedding base, returns `{ currency, rate, baseMinor }` with rules — base currency → rate 1, base = minor; foreign → require rate (fallback `wedding.rates[currency]`), base = `Math.round(minor × rate)`.
- Routes (`expenses.ts`, `payments.ts`, `vendors.ts`, `tasks.ts`, `locations.ts`) apply the helper on create/patch for every money field, persist snapshots, and update `wedding.rates[currency]` with the rate used.
- Serializers include the new fields.
- `apps/api/src/domain/money.ts`: `computeBudget`, `computeCategorySpend`, `paymentTotals` sum `base*` fields instead of originals. `payments.ts` recompute uses `baseAmountMinor`.
- Migration/backfill: existing records get `currency="AED"`, `rate=1`, base fields copied from original minors (one-off script `scripts/ci/backfill-currency.mjs` run against prod, or a startup-safe idempotent backfill — decide in PR).

## Acceptance

- Creating an LKR expense with rate 0.0122 stores `estimatedMinor` (original), `currency="LKR"`, `rate=0.0122`, `baseEstimatedMinor=Math.round(estimatedMinor*0.0122)`.
- Wedding `rates.LKR` updated after the first LKR entry.
- Budget/dashboard totals and payment status match hand-computed base sums.
- Existing AED data unchanged after backfill.
