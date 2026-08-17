# 17 — Hardening & docs

**What to build:** The whole app is verified end-to-end — permissions swept, rules and env documented, states polished — ready to hand to a first user.

**Blocked by:** 11 — Global calendar; 13 — Search, quick-add & notifications; 14 — Collaboration: members, roles, invites; 15 — Settings & activity feed

**Status:** ready-for-agent

- [ ] Permission sweep: every write endpoint tested against the role matrix
- [ ] Storage rules + Firebase setup instructions in README (project, auth providers, storage, env vars)
- [ ] .env.example with all required variables (no secrets committed)
- [ ] Loading/empty/error state pass across all modules
- [ ] Lint + typecheck + full test suite green at repo root
- [ ] README: local dev, architecture summary, deferred-features roadmap
