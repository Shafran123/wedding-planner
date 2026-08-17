# Deploy the web app on Vercel, the API on Railway, and data on MongoDB Atlas

The production topology is Vercel (Next.js web) → Railway (Express API) → MongoDB Atlas M0, with Firebase Auth on the existing project. Production is the only environment; every merge to `main` is a Release (auto-bumped patch version + `vX.Y.Z` git tag) deployed by GitHub Actions after checks pass.

## Considered options

- **Single VPS + Docker Compose + Caddy** — more control and a flat ~$6/mo, but we would own OS updates, Dockerfiles, TLS, and backups for a <100-user personal app. Rejected: ops burden outweighs the control we need today.
- **Cloud-native (AWS Fargate / GCP Cloud Run)** — maximum control, unjustified cost and complexity at this stage. Rejected.
- **Reusing the existing Firebase project for prod** (chosen over a fresh project) — no users to migrate and the account we care about already lives there; switching projects later only gets harder.

## Consequences

- Atlas M0 has no snapshot backups: we run a documented manual `mongodump` monthly (see README).
- The existing Firebase project becomes the production project — its current data is now prod data.
- Versioning is automatic (patch bump per deploy) rather than manual semantic releases; git tags `v0.0.x` are the release history and rollback points.
- No migration framework yet: Mongoose `autoIndex` handles indexes; schema changes are one-off scripts.
