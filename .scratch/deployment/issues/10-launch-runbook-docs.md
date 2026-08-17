# 10 — Launch runbook + deployment docs

`Status: ready-for-agent`
`Blocked by:` 09 (documents the pipeline that must exist first).

## Context

The README's "Deploying" section predates this pipeline (no CI, no runbook). Decided: manual monthly backup, platform + tag rollback, prod-only.

## Deliverable — rewrite the README "Deploying" section:

- Architecture diagram (web → API → Atlas + Firebase).
- Full env var inventory per platform (mirror of spec.md).
- First-deploy order for a fresh clone of the infra (cutover runbook).
- Rollback steps: platform one-click **and** `git checkout v0.0.X` + redeploy.
- **Backup command**: exact `mongodump --uri "<atlas srv uri>" --out=backup-<date>` + `mongorestore` restore steps; note the monthly cadence.
- How to add a custom domain and/or a pre-prod environment later.

## Acceptance

- A new developer can follow the README to provision and roll back without asking.
- Backup and restore commands are copy-paste runnable.
