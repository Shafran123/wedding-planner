# 09 — Locations & venue comparison

**What to build:** A user adds every wedding location with photos and statuses, compares shortlisted venues side by side, marks the chosen one, and opens any location in Maps.

**Blocked by:** 03 — Wedding creation & onboarding

**Status:** ready-for-agent

- [ ] Location API: CRUD with type, address, lat/lng, website, contact, capacity, costs, status (researching → booked/rejected), notes, images
- [ ] Locations list + detail page with image uploads via Firebase Storage (weddings/{id}/locations/...)
- [ ] Venue comparison table: price, capacity, location, parking, catering, decoration, accommodation, rating, notes across shortlisted venues; mark one selected
- [ ] Open in Maps / Get Directions deep links built from address + coordinates
- [ ] Storage rules scoped to weddings/{weddingId}/... committed with size/type validation
