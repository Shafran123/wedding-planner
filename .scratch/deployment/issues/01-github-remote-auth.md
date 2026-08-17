# 01 — Push repo to GitHub and authenticate

`Status: ready-for-human`
`Blocked by:` none — everything CI-related waits on this.

## Context

The repo exists at `github.com/Shafran123/wedding-planner` but is **empty**. The local repo has **no git remotes**, HEAD is `00d7126`, and the `gh` CLI is installed but unauthenticated.

## Deliverable

1. `gh auth login` (human step — browser/device flow).
2. `git remote add origin git@github.com:Shafran123/wedding-planner.git` (SSH or HTTPS per your preference).
3. `git push -u origin main` — verify all history including `00d7126` appears on GitHub.
4. Confirm `main` is the default branch.

## Acceptance

- `git remote -v` shows the GitHub repo.
- GitHub shows the full commit history.
- `gh auth status` reports authenticated.
