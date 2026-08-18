# 05 — Base currency change with re-denomination

`Status: resolved`

`Blocked by: 02`

## Context

Changing the wedding's base currency (AED ↔ LKR) must convert every stored amount with an explicit rate; without a rate the change is blocked (spec D9).

## Deliverable

- `PATCH /api/wedding`: when the incoming `currency` differs from current, require `rate` (1 old base = `rate` new base, > 0); otherwise 400. Run re-denomination in one transaction:
  - For each money record: if `currency == newBase` → `rate=1`, base = original minor; if `currency == oldBase` → `rate = changeRate`, base = `round(original × changeRate)` (only two currencies exist, so these exhaust the cases).
  - Budget category `plannedMinor` × changeRate (rounded); wedding `totalBudgetMinor` × changeRate (rounded).
  - Update `wedding.rates`: store the LKR rate appropriate to the new base (newBase LKR → changeRate; newBase AED → `1/changeRate`).
- Settings UI: on selecting a different base currency, show a rate prompt prefilled from the inverse/last-known rate, and disable submit until a rate is entered. Call the API with `currency` + `rate`.
- Serializer/type updates for the new request shape.

## Acceptance

- AED → LKR at 80 (1 AED = 80 LKR) converts an AED 500 expense into `currency="AED"`, `rate=80`, `baseEstimatedMinor=40000`; planned categories and total budget scale by 80.
- Changing without a rate returns 400 and nothing is modified.
- Budget/dashboard totals are consistent after re-denomination.

## Comments

- Implemented on `feature/multi-currency-categories`; lint, typecheck and tests green.
