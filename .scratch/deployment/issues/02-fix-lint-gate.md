# 02 — Fix lint gate

`Status: resolved`

## Comments

- auth.tsx: dropped the ref entirely — `getToken` now reads `getClientAuth()?.currentUser` (Firebase SDK updates it before any listener fires, so it can never be stale). Cleaner than a render-time ref write.
- onboarding: reverted to `router.replace("/dashboard")` — the settled-data guard in the layout is the real bounce fix; e2e journey confirms no regression.
- locations `<img>` → `next/image` with `unoptimized` (Firebase Storage URLs pass through as-is; no remotePatterns config needed).
- Verified: lint 0/0, typecheck clean, all 3 e2e loops green.
`Blocked by:` none.

## Context

`npm run lint` fails today, which would block the CI gate in ticket 06:
- **Error** `apps/web/contexts/auth.tsx:75` — `react-hooks/refs`: `userRef.current = user` is a ref write during render.
- **Warnings**: `<img>` should be `next/image`; `window.location.assign` in `apps/web/app/onboarding/page.tsx` triggers `no-restricted-globals`.

## Deliverable

- Move the `userRef.current` update out of render (an effect), preserving the stale-closure fix for the reload sign-out bug — do not reintroduce per-user `configureApi` registration.
- Fix the `<img>` warning (or `// eslint-disable-next-line` with justification if the image is non-optimizable).
- Replace `window.location.assign("/dashboard")` with an equivalent that passes lint (e.g. `window.location.href = "/dashboard"` or targeted disable).

## Acceptance

- `npm run lint` exits 0 with zero errors and zero warnings.
- `npm run typecheck` and `npm run build -w @wedding/web` still pass.
- `npm run test:e2e` (auth-reload + onboarding + journey loops) still green.
