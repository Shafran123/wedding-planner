# 03 — Currency + rate inputs in money forms

`Status: resolved`

`Blocked by: 02`

## Context

Every form that takes money must let the user pick AED or LKR and, for LKR, edit the rate prefilled from the wedding's last-used rate (spec D4, D8).

## Deliverable

- Shared `MoneyInput` component (currency select + amount + conditional rate field): defaults currency to wedding base; choosing the foreign currency reveals a rate field prefilled with `wedding.rates[currency]`; rate is editable; base-equivalent preview shown live under the field.
- Wire into: `expense-form.tsx` (estimated + actual), `payment-form.tsx`, `vendor-form.tsx`, `task-form.tsx` (estimated + actual cost), `location-form.tsx` (estimated + actual cost), `quick-add.tsx` (QuickExpense).
- Forms send `currency` + `rate` to the API. Base currency selected → rate omitted/1.
- Settings and onboarding base-currency selects: unchanged code, now showing only AED + LKR (ticket 01). Settings currency change must collect the re-denomination rate (see ticket 05 — keep the form wired so ticket 05 only adds the rate prompt).

## Acceptance

- LKR expense with prefilled rate saves correctly; next LKR entry prefills the updated last-used rate.
- AED entries show no rate field.
- Live preview shows the converted base amount and updates as the rate changes.

## Comments

- Implemented on `feature/multi-currency-categories`; lint, typecheck and tests green.
