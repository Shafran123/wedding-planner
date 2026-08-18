# 06 — Category CRUD API (rename, delete, usage counts)

`Status: ready-for-agent`

## Context

Budget and task categories must be renameable and deletable by any member; deletion blocked while in use; duplicates rejected (spec D10/D11).

## Deliverable

- `GET /api/budget`: each category response gains `expenseCount` (count of expenses referencing it).
- `POST /api/budget/categories`: case-insensitive duplicate-name check per wedding → 409.
- `PATCH /api/budget/categories/:id`: accept `name` rename (same duplicate check); keep existing planned-amount edit behavior.
- `DELETE /api/budget/categories/:id`: 409 when `expenseCount > 0`; else hard delete.
- `GET /api/task-categories`: each category gains `taskCount`.
- `PATCH /api/task-categories/:id`: new — rename with duplicate check.
- `DELETE /api/task-categories/:id`: new — 409 when `taskCount > 0`; else hard delete.
- Permission: any authenticated wedding member (owner-only checks if the routes have them stay as-is for ownership of the wedding itself).

## Acceptance

- Renaming a category updates it everywhere (items render the new name).
- Deleting an in-use category returns 409 with a clear message; deleting an unused one removes it.
- Duplicate names (case-insensitive) rejected on create and rename.
