# 04 — Dual-amount display everywhere

`Status: resolved`

`Blocked by: 02`

## Context

Foreign-currency records display primary in their currency with the base equivalent as secondary text; totals stay base (spec D8).

## Deliverable

- Extend `apps/web/lib/format.ts`: `formatMoney(record)` returns primary string; `formatMoneyWithBase(record, baseCurrency)` returns the secondary `≈ AED …` line (empty for base-currency records). Keep existing `formatMinor` for totals.
- Apply dual display on: expenses list + expense detail, payments list + payment detail, vendor list + detail, task list + detail, locations list + detail, dashboard recent items, search dialog results.
- Budget totals, donut, KPI cards, remaining/paid/upcoming sums: base currency only (they already sum server-side base values).
- Fix any place that formats amounts with a hardcoded `"AED"` default without the wedding currency (e.g. `search-dialog.tsx`).

## Acceptance

- An LKR expense shows `Rs 10,000` with `≈ AED 122` beneath it; an AED expense shows only `AED …`.
- All totals remain in the base currency and match ticket 02's server sums.

## Comments

- Implemented on `feature/multi-currency-categories`; lint, typecheck and tests green.
