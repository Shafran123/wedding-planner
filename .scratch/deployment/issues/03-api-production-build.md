# 03 — API production build + start path

`Status: resolved`

## Comments

- Implemented with esbuild instead of tsc: `apps/api/scripts/build.mjs` bundles `src/index.ts` → `dist/index.js` (ESM, `--packages=external`, `@wedding/shared` aliased to its TS source). No import-extension rewrites needed, dev flow (`tsx watch`) untouched, typecheck still `tsc --noEmit`.
- `start: node dist/index.js` added to `apps/api/package.json`.
- Verified: clean build boots on `node dist/index.js` without tsx, connects to Mongo, serves requests.
`Blocked by:` none.

## Context

The API has **no production start path** — a blocker for Railway:
- No `start` script in `apps/api/package.json`.
- `tsc` emits to `dist/src/index.js` (no `rootDir`).
- Plain `node dist/src/index.js` fails: `@wedding/shared` ships raw TypeScript with extensionless ESM imports, and `tsx` is a devDependency.

## Deliverable

- `packages/shared`: add `build` (`tsc`, `rootDir: src`, `outDir: dist`) and point `main`/`types` at `dist/index.js`/`dist/index.d.ts`.
- `apps/api`: `rootDir: src` in tsconfig (build emits `dist/index.js`), exclude `tests` from the build output, add `"start": "node dist/index.js"`.
- Root `npm run build` keeps building all workspaces in dependency order (it already runs `--if-present` per workspace).
- Railway service runs `npm run start -w @wedding/api` (or `node apps/api/dist/index.js`) — see ticket 07.

## Acceptance

- `rm -rf apps/api/dist packages/shared/dist && npm run build` succeeds.
- `npm run start -w @wedding/api` boots, connects to local Mongo, and listens on `PORT` **without tsx installed at runtime**.
- `npm run dev` unchanged.
