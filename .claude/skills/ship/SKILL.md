---
name: ship
description: Ships current work — branches, commits, pushes, and opens a PR. Use when the user says "ship", "ship it", "commit and push", "open a PR", "manda isso", "abre PR", or wants to finalize and share their current work.
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(gh *)
---

Ship the current work to a pull request. The flow is idempotent — check state before each step and skip what's already done.

## 1. Branch

Check the current branch with `git branch --show-current`.

- If on `main` or `master`: create and switch to a new branch. Suggest a name based on the staged/unstaged diff (kebab-case, max 4 words, e.g. `add-starship-config`). Confirm with the user before creating.
- If already on a feature branch: stay on it. No action needed.

## 2. Commit

Check for uncommitted changes with `git status --short`.

- If nothing to commit: skip this step.
- If there are changes: stage everything with `git add -A`, then generate a commit message from `git diff --cached`. The message should answer "what does this change do?" in imperative form — not list files. Show the message to the user and ask for confirmation or edits before committing.

## 3. Push

Check if the branch has a remote tracking branch with `git rev-parse --abbrev-ref @{u}` (will error if no upstream).

- If no upstream: push and set it with `git push -u origin <branch>`.
- If upstream exists and there are new commits: `git push`.
- If already up to date: skip.

## 4. Pull Request

Check for an existing PR with `gh pr list --head <branch> --json url --jq '.[0].url'`.

- If a PR already exists: show its URL and stop.
- If no PR: create one with `gh pr create`. Generate the title from the first commit on the branch (`git log main..HEAD --oneline | tail -1`), and the body from the full commit list. Show title and body to the user before creating — let them edit if needed.

## Errors

If any step fails, stop and explain clearly what happened. Don't retry silently.
