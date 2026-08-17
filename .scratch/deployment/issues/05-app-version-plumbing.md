# 05 — Visible app version in the webapp

`Status: resolved`

## Comments

- Single source of truth: root `package.json` (set to `0.0.1` per the grilling decision); `apps/web/next.config.ts` injects `NEXT_PUBLIC_APP_VERSION`/`NEXT_PUBLIC_APP_SHA` via `env` with root-version + `dev` fallbacks; the API `/health` also reads the root package.
- `apps/web/lib/version.ts` exposes `VERSION_LABEL` (`v0.0.1 · Beta`), `FULL_VERSION` (`v0.0.1+<sha>`), channel, and environment.
- Sidebar footer shows the badge; Settings gained an **About** tab (version, channel, build, environment).
- Journey e2e now asserts both (GREEN-V + GREEN-About). Built bundle verified to contain injected version/sha values.
`Blocked by:` none.

## Context

The user explicitly flagged: **the webapp has never shown a version**. Decided format (grilling Q5/Q6): start at `0.0.1`, `Beta` badge, auto patch-bump per prod deploy, shown as:

- Sidebar footer: `v0.0.1 · Beta` (subtle badge)
- Settings → About: `v0.0.1+<7-char git sha>` plus environment name

## Deliverable

- Build-time env plumbing: `NEXT_PUBLIC_APP_VERSION` and `NEXT_PUBLIC_APP_SHA` (read in `next.config.ts`/env; fall back to root `package.json` version + `"dev"` locally so nothing breaks without CI).
- A small `VersionBadge` component (sidebar footer) with the Beta label.
- Settings page "About" section rendering full version + sha + environment.
- Version source of truth stays root `package.json` (see ticket 09's bump script); do not hardcode a second copy.

## Acceptance

- Locally (`npm run dev`): footer shows `v0.1.0 · Beta` (current package version), Settings → About shows sha or `dev`.
- `next build` with `NEXT_PUBLIC_APP_VERSION=0.0.1 NEXT_PUBLIC_APP_SHA=abc1234` renders `v0.0.1 · Beta` and `0.0.1+abc1234`.
- E2E smoke (ticket 11) asserts the badge is visible.
