# 10 — Launch runbook + deployment docs

`Status: resolved`

## Comments

- README "Deploying" rewritten: architecture diagram, full env inventory (Railway/Vercel/GitHub), pipeline + versioning description, rollback via tags + platform, monthly `mongodump`/`mongorestore` commands, prod smoke + cleanup commands, and future custom-domain/pre-prod steps.

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
