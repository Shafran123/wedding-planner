# 13 — Search, quick-add & notifications

**What to build:** From anywhere in the app, a user finds any entity via global search, captures anything via quick-add, and stays current through the notification center.

**Blocked by:** 05 — Tasks module; 06 — Budget module; 07 — Payments module; 08 — Vendors module; 09 — Locations & venue comparison; 10 — Events & timeline; 12 — Notes & attachments

**Status:** ready-for-agent

- [ ] Global search across tasks, vendors, locations, events, notes, expenses, payments with debounce + keyboard navigation; results link to entity pages
- [ ] Quick-add button (global) opening task/expense/vendor/event/location/note dialogs with minimal fields; works from any page
- [ ] Notification center in header: unread count, list, mark-read
- [ ] API writes notifications on: payment due within 7 days, budget threshold crossed by a payment, event within 7 days; task due-soon/overdue notifications computed from task data
- [ ] Notification types styled distinctly; empty state
