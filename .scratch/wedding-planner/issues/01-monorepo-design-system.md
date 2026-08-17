# 01 — Monorepo & design-system scaffold

**What to build:** A developer boots the monorepo with one command, opens the web app and sees a styled placeholder with the Wedding Planner design system applied, and calls the API health endpoint.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] npm workspaces with apps/web, apps/api, packages/shared; single root install + root scripts (dev, build, test, lint)
- [ ] Next.js App Router app boots with TypeScript strict, Tailwind, shadcn/ui initialized
- [ ] Express API boots with TypeScript, health endpoint returning ok
- [ ] Shared package exports typed enums/constants consumed by both apps
- [ ] Design tokens: Inter + Playfair Display fonts, warm-neutral palette (cream, beige, muted rose, charcoal, gold), shadcn theme configured
- [ ] Vitest + supertest configured in API with one passing smoke test; lint + typecheck green across the workspace
