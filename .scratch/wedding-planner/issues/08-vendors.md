# 08 — Vendors module

**What to build:** A user manages every professional — adding vendors with statuses and contacts, opening call/email/WhatsApp/website/Instagram deep links, and seeing the full vendor story (notes, tasks, payments, documents) on one detail page.

**Blocked by:** 07 — Payments module

**Status:** ready-for-agent

- [ ] Vendor API: CRUD with category, contact person, phone, email, website, instagram, address, price, contract status, payment status, rating, notes; soft delete
- [ ] Vendors list filterable by category and status; status badges (researching → completed, rejected)
- [ ] Vendor detail page: contact info, price, booking/payment status, notes, linked tasks, linked payments, documents; empty states per section
- [ ] Quick actions via deep links: tel:, mailto:, wa.me, website, instagram
- [ ] Rejected vendors hidden from default views but retained in history
