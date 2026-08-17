# 05 — Tasks module

**What to build:** A user creates a task in seconds, browses it in list or kanban views, filters, completes it with one click, and sees due/overdue urgency everywhere.

**Blocked by:** 03 — Wedding creation & onboarding

**Status:** ready-for-agent

- [ ] Task API: create (quick: title + due) and full form (description, category, status, priority, due, assignee, estimated/actual cost, vendor/event links); edit; delete; completion with completedAt
- [ ] List view with columns (task, category, due, priority, assignee, status) + filters/sort by status/priority/category/due/assignee
- [ ] Kanban view with To Do / In Progress / Completed columns; move tasks between statuses
- [ ] Task detail page showing linked vendor/event/costs; link through from list
- [ ] Custom task categories creatable
- [ ] Due today / overdue badges; overdue detection logic tested (7d/3d/1d/today/overdue windows)
- [ ] Completion percentage logic tested; activity entry on completion
