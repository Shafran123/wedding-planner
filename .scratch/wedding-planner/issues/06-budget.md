# 06 — Budget module

**What to build:** A user sees total/planned/committed/paid/remaining at a glance, allocates the budget per category, adds expenses with receipts, and gets alerts before overspending.

**Blocked by:** 03 — Wedding creation & onboarding

**Status:** ready-for-agent

- [ ] Budget API: total budget update; budget category allocations (planned amounts); derived totals (committed, paid, spent, remaining, %)
- [ ] Expense CRUD with category/vendor links, due date, notes, receipt image upload; soft delete (deletedAt/deletedBy) excluding deleted rows from all totals
- [ ] Budget dashboard: summary cards, donut of planned allocations, allocation editor
- [ ] Alerts at 80%/90%/≥100% of total budget with appropriate severity styling
- [ ] Category overspend warnings: spent vs planned with excess amount
- [ ] Money math unit tests: remaining, percentage, over-budget, category overspend, integer minor-unit arithmetic
