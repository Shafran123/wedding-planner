# 02 — Firebase auth & API sessions

**What to build:** A visitor registers with email/password or Google, gets logged in, and the API accepts requests only with a valid Firebase ID token, creating a user document in MongoDB on first request.

**Blocked by:** 01 — Monorepo & design-system scaffold

**Status:** ready-for-agent

- [ ] /login, /register, /forgot-password pages with validation (RHF + Zod) and friendly errors
- [ ] Firebase client SDK initialized from env vars; Google provider button; email/password flows work end-to-end
- [ ] API verifies Firebase ID tokens on every protected route; syncs users collection on first authenticated request
- [ ] Protected endpoints return 401 for missing/invalid tokens
- [ ] Register/forgot flows handle Firebase error codes with user-friendly messages
- [ ] Supertest: valid token → 200, invalid token → 401
