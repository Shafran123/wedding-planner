# 03 — Wedding creation & onboarding

**What to build:** After registering, a user completes the onboarding wizard and lands in their app with a wedding created — default budget/task categories and template tasks generated from their wedding date.

**Blocked by:** 02 — Firebase auth & API sessions

**Status:** ready-for-agent

- [ ] Onboarding wizard with wedding name, partner names, date, location, currency, guest count, budget, wedding type, planning stage; non-essential steps skippable; validation with friendly messages
- [ ] API creates wedding + owner membership + default budget categories + default task categories in one operation
- [ ] Template tasks generated with due dates offset from wedding date; stored as normal editable tasks
- [ ] Countdown pure function: days/hours/minutes in wedding timezone; passed-date state; tests
- [ ] Planning progress pure function (completed / non-cancelled); tests
- [ ] Money validation: amounts as integer minor units; rejects negative/non-integer; tests
- [ ] Redirect to dashboard after completion; no dead-end if skipped
