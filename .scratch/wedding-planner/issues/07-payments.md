# 07 — Payments module

**What to build:** A user records payments against vendors/expenses, marks them paid, and sees upcoming/overdue/completed lists with the total paid always consistent with the budget numbers.

**Blocked by:** 06 — Budget module

**Status:** ready-for-agent

- [ ] Payment API: create with vendor/expense links, amount, due date, method (cash/card/bank transfer/online/other), reference, notes; edit; soft delete
- [ ] Marking paid atomically updates linked expense payment-status snapshot + writes activity entry; tests assert consistency of all three
- [ ] Payments UI: upcoming, overdue, completed lists; total paid summary
- [ ] Payment totals feed the budget dashboard numbers (paid/spent/remaining)
- [ ] Overdue detection logic tested; transaction tests via supertest
