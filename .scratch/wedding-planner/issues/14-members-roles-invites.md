# 14 — Collaboration: members, roles, invites

**What to build:** The owner invites the partner, planner, or family by email with a role; invited people accept and join; roles strictly enforce what each member can do.

**Blocked by:** 03 — Wedding creation & onboarding

**Status:** ready-for-agent

- [ ] Invitation API: owner/partner sends email invite with role; invitation stored with token + expiry
- [ ] Accept flow: invited person registers/logs in, accepts, becomes a member; invitation status transitions
- [ ] Members list with roles; owner manages roles and removes members
- [ ] Role middleware: viewer read-only (writes → 403), planner CRUD tasks/vendors/events only, partner full data CRUD, owner everything incl. members/settings
- [ ] Permission tests: user A cannot access wedding B (403); viewer cannot modify; owner can manage members
- [ ] Activity entries on membership changes
