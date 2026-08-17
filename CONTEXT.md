# Wedding Planner

A web application where couples plan their entire wedding from one shared dashboard — budget, tasks, vendors, locations, events, notes, and progress.

## Language

**Wedding**:
The workspace that owns all planning data for one couple's wedding.
_Avoid_: workspace, project

**Member**:
A user granted a Role on a Wedding.
_Avoid_: collaborator, participant

**Role**:
One of `owner`, `partner`, `planner`, `viewer` — determines what a Member may do.
_Avoid_: permission level, access tier

**Invitation**:
A pending email invitation for a person to become a Member of a Wedding.

**Task**:
A single planning to-do with a category, status, priority, and due date.
_Avoid_: item, todo entry, checklist item

**Task Category**:
A named grouping of Tasks (e.g. Venue, Catering, Invitations).

**Task Template**:
A definition that generates Tasks with due dates computed relative to the wedding date.
_Avoid_: checklist, preset

**Budget**:
The Wedding-level total amount of money available (`totalBudget`).
_Avoid_: wallet, funds

**Budget Category**:
A named slice of the Budget with a planned allocation (e.g. Photography: AED 8,000).
_Avoid_: budget line, bucket

**Expense**:
A planned line item with estimated and actual amounts, linked to a Budget Category. Its `paymentStatus` is a derived snapshot of its Payments.
_Avoid_: cost, charge, bill

**Payment**:
The authoritative ledger entry of money paid or due to a Vendor. Recording one updates its Expense's snapshot.
_Avoid_: transaction, transfer

**Vendor**:
A professional or company serving the wedding (photographer, caterer, venue operator…).

**Location**:
Any place used for the wedding (ceremony site, hotel, after-party…), with an address and optional coordinates.

**Venue**:
A Location whose type is venue — a ceremony or reception site. Venue comparison compares Venues.
_Avoid_: using "venue" for non-venue locations

**Event**:
A scheduled happening (Engagement, Nikah, Ceremony, Reception…), optionally at a Location.

**Timeline**:
The wedding-day sequence of Events ordered by start time.

**Note**:
Freeform text with a category (general, idea, shopping list, meeting…).

**Attachment**:
An uploaded image or file (inspiration, receipt, contract) referenced by URL.

**Activity**:
An audit entry recording who changed what and when.

**Notification**:
An in-app alert (task due soon, payment overdue, budget exceeded…) addressed to a user.

**Insight**:
A computed, actionable sentence surfaced on the dashboard, generated only from real data.

**Countdown**:
Days, hours, and minutes until the wedding date, computed in the Wedding's timezone.

**Planning Progress**:
The share of planning done: completed Tasks divided by total non-cancelled Tasks.

**Minor units**:
The integer representation of money — AED 1,500.00 is stored as `150000`.
