# Spec: Wedding Planner Web Application

**Status:** ready-for-agent

## Problem Statement

Couples planning a wedding juggle spreadsheets, chat threads, notes apps, and vendor WhatsApp messages. Budgets drift, deadlines slip, and nobody has one clear picture of what's spent, what's booked, and what needs attention next. Planning a wedding feels chaotic instead of enjoyable.

## Solution

A single, calm, premium web application where a couple plans their entire wedding together: create a wedding with a date and budget, generate a smart task plan from the date, track spending and payments against budget categories, manage vendors and locations, schedule events, keep notes, invite their partner and a planner to collaborate, and see exactly what needs attention today on one dashboard.

## User Stories

### Authentication & onboarding

1. As a visitor, I want to create an account with email/password or Google, so that I can start planning.
2. As a user, I want to log in with my existing credentials, so that I return to my wedding.
3. As a user who forgot my password, I want to reset it via email, so that I don't lose access.
4. As a new user, I want an onboarding wizard asking for the wedding name, couple names, date, location, currency, guest count, budget, wedding type, and planning stage, so that my workspace is set up in minutes.
5. As a new user, I want to skip the non-essential onboarding questions, so that I'm not blocked from the app.
6. As a new user, I want my first wedding created automatically when onboarding completes, so that I never see a "no workspace" dead end.
7. As a new user, I want default budget categories and task categories created with my wedding, so that I don't start from a blank sheet.
8. As a new user, I want smart task templates generated from my wedding date, so that I get a realistic planning plan immediately.
9. As a user, I want the generated tasks to be fully editable and deletable, so that the plan matches my reality.

### Dashboard

10. As a user, I want a personalised greeting with the wedding name and date, so that the dashboard feels like mine.
11. As a user, I want a large countdown showing days/hours/minutes until my wedding, so that I always know how much time is left.
12. As a user, I want KPI cards for budget spent/remaining, tasks completed, planning progress, and upcoming deadlines, so that I get the state of my wedding at a glance.
13. As a user, I want the next 5 upcoming tasks with category, due date, priority, and status, so that I know what to do next.
14. As a user, I want a donut chart of budget allocation by category, so that I see where the money is planned to go.
15. As a user, I want planning progress bars per category, so that I see which areas are lagging.
16. As a user, I want a recent activity feed, so that I see what my partner or planner changed.
17. As a user, I want upcoming events on the dashboard, so that nothing scheduled is forgotten.
18. As a user, I want actionable insights (budget % used, tasks due this month, payments due in 30 days, overdue high-priority tasks), so that the dashboard tells me what needs attention, not just numbers.
19. As a user whose wedding date has passed, I want the countdown to show a sensible passed state, so that the app doesn't break after the wedding.
20. As a user in a different timezone from the wedding, I want the countdown computed in the wedding's timezone, so that it's accurate.

### Tasks

21. As a user, I want to create a task with just a title and due date, so that capturing a task is effortless.
22. As a user, I want a full task form (description, category, status, priority, due date, assignee, estimated/actual cost, vendor and event links), so that important tasks carry enough context.
23. As a user, I want a list view of tasks showing title, category, due date, priority, assignee, and status, so that I can scan the plan.
24. As a user, I want a kanban view with To Do / In Progress / Completed columns, so that I can move work through states visually.
25. As a user, I want a calendar view of task deadlines, so that I see the plan in time.
26. As a user, I want to mark a task complete with one click, so that momentum is frictionless; completion is recorded with a timestamp and an activity entry.
27. As a user, I want to filter and sort tasks by status, priority, category, due date, and assignee, so that I can focus.
28. As a user, I want to edit and delete tasks, so that the plan stays accurate.
29. As a user, I want a task detail page showing its linked vendor, event, and costs, so that context is one click away.
30. As a user, I want due-today and overdue badges on tasks, so that urgency is visible without filtering.
31. As a user, I want to create custom task categories, so that the plan fits non-standard weddings.

### Budget

32. As a user, I want to set and change the total wedding budget, so that the budget reflects reality.
33. As a user, I want to see total budget, planned, committed, paid, and remaining amounts, so that I know the financial state.
34. As a user, I want to allocate planned amounts per budget category, so that the budget is deliberate rather than implicit.
35. As a user, I want a visual breakdown of planned allocations, so that proportions are obvious.
36. As a user, I want to create an expense with amount, category, vendor, and due date, so that planned costs are tracked.
37. As a user, I want to edit and soft-delete expenses, so that mistakes are fixable without losing history.
38. As a user, I want to attach a receipt image to an expense, so that paperwork lives with the numbers.
39. As a user, I want budget alerts at 80%, 90%, and 100% of the total budget, so that overspend is caught early.
40. As a user, I want category overspend warnings (spent vs planned, with the excess amount), so that I see which category broke its allocation.

### Payments

41. As a user, I want to record a payment against a vendor and expense, with amount, due date, and method (cash, card, bank transfer, online, other), so that the ledger matches the bank account.
42. As a user, I want marking a payment as paid to atomically update the linked expense's payment status and create an activity entry, so that the numbers never disagree.
43. As a user, I want upcoming, overdue, and completed payment lists plus total paid, so that cash-flow deadlines are visible.

### Vendors

44. As a user, I want to add a vendor with category, contact person, phone, email, website, Instagram, address, price, and status, so that every professional is in one place.
45. As a user, I want a vendor list filterable by category and status, so that I can find who's booked and who's still open.
46. As a user, I want a vendor detail page with contacts, price, booking status, payment status, notes, related tasks, payments, and documents, so that the vendor relationship is fully documented.
47. As a user, I want quick actions on a vendor — call, email, WhatsApp, open website, open Instagram — via deep links, so that contacting a vendor is one tap.
48. As a user, I want to soft-delete vendors, so that rejected vendors disappear without losing their history.

### Locations & venues

49. As a user, I want to add a location with name, type, address, coordinates, website, contact, capacity, cost, status, and photos, so that every place is documented.
50. As a user, I want a location list and detail page, so that I can review my places.
51. As a user, I want a venue comparison table across my shortlisted venues (price, capacity, location, parking, catering, decoration, accommodation, rating, notes), so that choosing is a real comparison.
52. As a user, I want to mark one venue as the selected venue, so that the decision is recorded.
53. As a user, I want "Open in Maps" and "Get Directions" links from a location's address/coordinates, so that navigation is one tap.

### Events & timeline

54. As a user, I want to create an event with name, type, date, start/end time, location, description, dress code, and guest count, so that every function is scheduled.
55. As a user, I want an events list and detail page, so that functions are easy to review.
56. As a user, I want a read-only wedding-day timeline ordered by start time, so that the day's flow is visible at a glance.
57. As a user, I want events to appear on the dashboard and calendar, so that they're never forgotten.

### Calendar

58. As a user, I want a month view calendar showing tasks, payments, events, vendor appointments, and venue visits as distinct items, so that the whole plan is in one place.
59. As a user, I want an agenda view of the same items, so that I can read the plan as a list.
60. As a user, I want to filter which item types appear on the calendar, so that it stays readable.

### Notes & attachments

61. As a user, I want to create notes with categories (general, vendor, venue, wedding idea, shopping list, meeting notes), so that thoughts are organised.
62. As a user, I want to edit and delete notes, so that they stay current.
63. As a user, I want markdown formatting rendered in notes, so that they're pleasant to read.
64. As a user, I want to upload images and files (inspiration, contracts, receipts) attached to the wedding, so that inspiration is saved alongside the plan.

### Collaboration

65. As a wedding owner, I want to invite a partner, planner, or family member by email with a chosen role, so that we plan together.
66. As an invited person, I want to accept the invitation (registering if needed), so that I become a member of the wedding.
67. As a member, I want my role to enforce what I can do — a viewer can read only, a planner manages tasks/vendors/events, a partner edits normal planning data, and the owner manages everything including members — so that the wedding data stays safe.
68. As an owner, I want to see and manage the member list and roles, so that access stays current.
69. As a user, I want an activity feed showing who did what, so that changes are attributable.

### Notifications

70. As a user, I want a notification center with task due soon/overdue, payment due/overdue, budget exceeded, and upcoming event notifications, so that I don't have to hunt for urgency.
71. As a user, I want unread counts and the ability to mark notifications read, so that the inbox stays tidy.

### Search & quick add

72. As a user, I want a global search across tasks, vendors, locations, events, notes, expenses, and payments, so that anything is findable.
73. As a user, I want a quick-add button available everywhere for task, expense, vendor, event, location, and note, so that capturing anything is one click.

### Settings & profile

74. As a user, I want to update my name and profile photo, so that my identity is mine.
75. As a user, I want to edit wedding settings (names, date, currency, timezone, type, guest count), so that the wedding stays accurate.
76. As a user, I want notification preferences, so that I control what surfaces.

### Design & experience

77. As a mobile user, I want a top header and bottom navigation instead of a squeezed sidebar, so that the app feels native on my phone.
78. As a user, I want loading skeletons, helpful empty states with a call to action, and friendly error messages, so that the app never feels broken.
79. As a user with assistive technology, I want semantic HTML, focus states, aria labels, and sufficient contrast, so that the app is usable.
80. As a visitor, I want a beautiful landing page explaining the product with a "Start Planning Free" call to action, so that I understand the value before signing up.
81. As a visitor, I want the landing page to be SEO-friendly while my wedding data stays behind authentication, so that the product is discoverable and private.

## Implementation Decisions

- **Monorepo**: npm workspaces with `apps/web` (Next.js App Router), `apps/api` (Express), and `packages/shared` (TypeScript types, Zod schemas, enums and constant lists such as categories, currencies, and templates). Shared types are the single source of truth.
- **Frontend stack**: Next.js App Router, strict TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, React Hook Form + Zod validation, Recharts, date-fns, SWR for data fetching with polling refetch (no websockets in MVP).
- **Design system**: Inter for UI, Playfair Display for wedding headings; warm neutrals, cream, muted rose, charcoal, subtle gold; no excessive pink or decorative clichés; consistent shadcn theme tokens.
- **Backend stack**: Express + Mongoose on MongoDB; Firebase Admin SDK verifies Firebase ID tokens on every request (no separate JWT issuance); the API is the only writer to the database.
- **Auth providers**: email/password and Google at MVP; the auth layer is provider-agnostic so Firebase phone (SMS) auth can be enabled later.
- **Data model** (Mongoose, wedding-centric): `users`, `weddings`, `members`, `invitations`, `tasks`, `taskCategories`, `expenses`, `payments`, `vendors`, `locations`, `events`, `notes`, `attachments`, `notifications`, `activities`. Every entity carries `weddingId`; membership is checked server-side on every request. Soft delete (`deletedAt`, `deletedBy`) on expenses, payments, vendors, and notes; soft-deleted records are excluded from all queries and totals.
- **Roles and permissions** (enforced in API middleware, never trusted from the client): owner — everything including members, invitations, and wedding settings; partner — read, create, update, delete all normal planning data; planner — read all, create/update/delete tasks, vendors, and events; viewer — read only. The inviting user's role must be owner or partner.
- **Money**: all amounts are integer minor units per the ADR; currency lives on the Wedding; AED is the onboarding default among 11 supported currencies; formatting to display units happens only in the web layer. The API rejects negative or non-integer amounts.
- **Budget derivation**: committed = sum of estimated amounts of active (non-cancelled) expenses; paid = sum of completed payments; spent = paid; remaining = totalBudget − spent; percentage = spent / totalBudget. Category spent = sum of paid payments whose expense belongs to that category. Alerts fire at 80%, 90%, and ≥100% of total budget; a category is over budget when its spent exceeds its planned allocation.
- **Payment recording transaction**: recording a payment updates the payment, recomputes the linked expense's payment-status snapshot, and appends an activity entry in one write sequence.
- **Countdown**: computed in the Wedding's timezone as days/hours/minutes; explicit passed-date state.
- **Planning progress**: completed tasks divided by total non-cancelled tasks; per-category progress uses the same formula scoped to each category. The algorithm is isolated so a weighted formula can replace it later.
- **Task templates**: a fixed list of template tasks with offsets (12+ months … final week before the wedding date); generated at onboarding, stored as normal tasks, fully editable/deletable. Default task and budget categories are created with the wedding.
- **Calendar**: custom-built month + agenda views showing tasks, payments, events, vendor appointments, and venue visits as unified items with type filters. Week/day views are deferred.
- **File storage**: Firebase Storage with `weddings/{weddingId}/...` paths; the API issues nothing privileged — the client uploads directly and persists metadata + download URL in the database; size and MIME validation both client- and server-side. Storage security rules ship with the repo.
- **Notifications**: persisted notification documents created by the API on meaningful events (payment due within 7 days, budget threshold crossed by a payment, event within 7 days); task due-soon/overdue notifications are computed from tasks. In-app only for MVP; FCM pluggable later.
- **Search**: client-side filtering over API-fetched, cached collections with a debounced input; the API exposes list endpoints with pagination limits so the client holds bounded data.
- **i18n readiness**: all UI strings in a central dictionary; RTL-safe layout; English only for MVP.
- **SaaS readiness**: `plan`, `subscriptionStatus`, `subscriptionId`, `trialEndsAt` fields exist on the wedding but are unused; no billing in MVP.
- **Deferred features** stay architecturally possible but are not built: drag-and-drop timeline editing, keyboard shortcuts, Arabic UI, PDF exports, AI assistant, guest/RSVP/seating, vendor marketplace, seed scripts.

## Testing Decisions

- **The seam is the API.** All business logic lives in pure modules inside the API (money math, countdown, progress, permissions, template generation); the web app renders and formats only.
- **Good tests assert external behaviour** — given this data, this result — never implementation details.
- **Unit tests (Vitest)** cover: budget remaining/percentage/over-budget, category overspend, payment totals, task completion percentage and overdue logic, countdown (including past date and timezone), planning progress, task-template deadline offsets.
- **Integration tests (Vitest + supertest against MongoDB)** cover: auth middleware (valid/invalid/expired Firebase token), role enforcement (non-member → 403; viewer blocked from writes; owner manages members), and the payment-recording transaction (payment + expense snapshot + activity consistent).
- No UI/E2E tests in this pass.

## Out of Scope

- Drag-and-drop wedding timeline editing (read-only timeline ships)
- Keyboard shortcuts
- Arabic UI (i18n architecture only)
- PDF exports, AI assistant, guest management/RSVP/seating, vendor marketplace
- SaaS billing/payment processing (schema fields only)
- FCM push notifications (in-app only)
- Calendar week/day views (month + agenda only)
- Seed/demo scripts
- Multi-wedding account switching (a user belongs to one wedding at MVP)

## Further Notes

- The README documents Firebase project setup (Authentication with email/password + Google, Storage), environment variables, local development, and deployment.
- Firebase phone (SMS) auth is a planned post-MVP provider, enabled by configuration only.
- The product principle throughout: the app guides ("your most important tasks this week are…"), it never dumps raw CRUD tables.
- Working product name is "Wedding Planner"; branding is not final.
