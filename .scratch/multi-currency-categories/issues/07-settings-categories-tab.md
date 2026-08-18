# 07 — Settings: Categories tab

`Status: resolved`

`Blocked by: 06`

## Context

Members manage budget and task categories from Settings (spec D10).

## Deliverable

- New "Categories" tab in `apps/web/app/(auth)/settings/page.tsx` (join the existing tab structure), two sections:
  - **Budget categories**: list with planned amount, usage count (`N expenses`), inline rename, delete button (confirm dialog; locked with tooltip when in use), and an add form (name + planned amount).
  - **Task categories**: list with usage count (`N tasks`), inline rename, delete (same lock rules), add form (name).
- Uses the endpoints from ticket 06; optimistic refresh of category lists across pages after mutation (invalidate shared queries where the app already refetches on navigation — no new caching infra).
- Error surfaces: duplicate name, in-use delete → toast/inline message.

## Acceptance

- Add/rename/delete works for both category types; locked categories cannot be deleted.
- Items elsewhere (tasks, expenses) reflect renames after refresh.

## Comments

- Implemented on `feature/multi-currency-categories`; lint, typecheck and tests green.
