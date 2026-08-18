# Spec: Multi-currency money + editable categories

**Status:** needs-triage

## Problem Statement

Two friction points in the current app:

1. **Everything is in one currency.** A wedding sets a base currency at onboarding (today: AED), and every amount everywhere — expenses, payments, vendor prices, task costs, location costs — is forced into that currency. A couple paying suppliers in a second currency (LKR) has to convert by hand every time, and there is no record of the original amount or the rate used.
2. **Categories are frozen.** Budget and task categories are seeded once at onboarding. Members cannot add, rename, or delete them, so a wedding stuck with an irrelevant category must either ignore it or mislabel items.

## Solution

Two coordinated features:

1. **AED + LKR money everywhere.** Every money field can be entered in AED or LKR. A manually entered exchange rate converts LKR amounts to the base currency at entry time, and the original amount, currency, rate, and converted base amount are stored as a snapshot on the record. All budget totals remain in the base currency. The last-used rate is remembered on the wedding and prefilled into forms.
2. **Editable budget & task categories.** Members can add, rename, and delete budget and task categories from a new Settings tab. Deletion is blocked while the category is in use.

## Decisions (settled during grilling)

| # | Decision |
|---|----------|
| D1 | Currencies supported: **AED and LKR only**. Base currency default AED. `CURRENCIES` shrinks to these two. |
| D2 | Rates are **manual** — no live API. frankfurter.dev rejected because it does not publish LKR. |
| D3 | **Snapshot storage**: each money record keeps original amount + currency + rate + converted base amount. Budgets never drift when rates change later. |
| D4 | The rate used on save is stored on the wedding (`rates.LKR`) and prefilled into the next LKR entry. Editable per item before saving. No separate rates settings UI. |
| D5 | Server computes and stores the base amount from `minor × rate`. Client never sends computed money. |
| D6 | Rounding: converted base amounts round to 2 decimals; the rate itself is stored with up to 6 decimals. (KWD/BHD 3-decimal currencies are out of scope — they are also removed from the picker.) |
| D7 | Multi-currency applies to: expense estimated+actual, payment amount, vendor price, task estimated+actual cost, location estimated+actual cost. Budget category `planned` and wedding `totalBudget` stay base-currency only. |
| D8 | Display: primary in the item's currency; base equivalent shown as secondary text on cards/tables/detail pages. All totals in base currency. |
| D9 | Changing the base currency later requires a manual old→new rate; the server re-denominates every stored base amount, category plan, and total budget. No rate entered = change blocked. |
| D10 | Categories: budget + task only (vendor categories stay a hardcoded constant). Any member may add/rename/delete. |
| D11 | Deletion is blocked while the category is referenced (expenses for budget, tasks for task categories). Rename is always allowed. Duplicate names (case-insensitive, per wedding) rejected on create and rename. |
| D12 | New weddings keep the current seed categories unchanged. Existing records are backfilled: `currency="AED"`, `rate=1`, base = original amount. |

## Data model

### Wedding

Add `rates: { LKR: number | null }` — last-used manual rate for LKR→base (AED). `null` until the first LKR entry.

### Money-bearing models: Expense, Payment, Vendor, Task, Location

Each gains:

- `currency`: `"AED" | "LKR"`, default `"AED"` (the record's input currency)
- `rate`: number ≥ 0, default `1` (units of base per 1 unit of `currency`; forced to 1 when `currency` equals the wedding base)
- Base snapshot fields (computed server-side, rounded to 2 decimals):

| Model | Original fields (unchanged) | New base snapshots |
|---|---|---|
| Expense | `estimatedMinor`, `actualMinor` | `baseEstimatedMinor`, `baseActualMinor` |
| Payment | `amountMinor` | `baseAmountMinor` |
| Vendor | `priceMinor` | `basePriceMinor` |
| Task | `estimatedCostMinor`, `actualCostMinor` | `baseEstimatedCostMinor`, `baseActualCostMinor` |
| Location | `estimatedCostMinor`, `actualCostMinor` | `baseEstimatedCostMinor`, `baseActualCostMinor` |

Server-side computation on write: if `currency == weddingBase` → `rate = 1`, `baseX = originalX`; else require `rate` (fall back to `wedding.rates[currency]` if omitted), `baseX = round(originalX × rate)`. After save, update `wedding.rates[currency] = rate`.

### Totals

`apps/api/src/domain/money.ts` (`computeBudget`, `computeCategorySpend`, `paymentTotals`) switches from summing `*Minor` to summing the `base*` fields. Payment status recompute (`payments.ts`) uses `baseAmountMinor`.

## API changes

- `POST`/`PATCH` for expenses, payments, vendors, tasks, locations: accept optional `currency` and `rate`; responses include them plus the base snapshot fields.
- `PATCH /api/wedding` with a currency change: requires `rate` (old→new); performs re-denomination (see below); no `rate` = 400.
- `GET /api/budget`: each category gains `expenseCount`.
- `POST /api/budget/categories`: add case-insensitive duplicate-name check.
- `PATCH /api/budget/categories/:id`: new — rename (plus existing planned-amount edit).
- `DELETE /api/budget/categories/:id`: new — 409 if `expenseCount > 0`.
- `GET /api/task-categories`: each category gains `taskCount`.
- `PATCH /api/task-categories/:id`: new — rename, duplicate check.
- `DELETE /api/task-categories/:id`: new — 409 if `taskCount > 0`.

## Re-denomination (base currency change)

Given rate `r` (1 old base = `r` new base), for every record: recompute `rate` and base snapshot from the *original* amount: `currency == newBase` → `rate=1`, `base=original`; `currency == oldBase` → `rate=r`, `base=round(original × r)`. Category `plannedMinor` and wedding `totalBudgetMinor` multiply by `r` (rounded). `wedding.rates.LKR` updated accordingly. All performed in one transaction.

## UI

- Currency + rate inputs appear in: expense form, payment form, vendor form, task form, location form, quick-add expense. Currency defaults to the wedding base; choosing LKR reveals the rate field prefilled with the wedding's last-used rate.
- Base currency select in onboarding and Settings shrinks to AED/LKR. Changing it in Settings shows a rate prompt (old→new) before submitting.
- Dual display: item currency primary, base equivalent secondary (e.g., `Rs 10,000 · ≈ AED 135`). All totals/donut remain base.
- Settings gains a **Categories** tab: two sections (Budget categories, Task categories) with add / inline rename / delete (with confirm), usage count, and an in-use lock.

## Out of scope

- Live exchange rates / frankfurter.dev
- Currencies other than AED and LKR
- Editable vendor categories
- 3-decimal currency precision

## Tickets

See `issues/` — 01 constants, 02 money model + totals, 03 form inputs, 04 dual display, 05 re-denomination, 06 category CRUD API, 07 Settings categories tab, 08 tests/docs/version.
