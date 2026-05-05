---
name: parallel-worktree
description: Orchestrate parallel tasks with isolated Git worktrees
---

# Workflow: Parallel Worktree

Use this workflow to isolate, execute, validate, and merge independent tasks in parallel.

## Prerequisites

- Tasks must be independent.
- Use the first existing base branch from: `release/next` > `develop` > `main` > `master`.
- Use one unique `{task-id}` per task:
  - Worktree path: `.trees/{task-id}/`
  - Branch name: `task/{task-id}`

## Required Skills

Load these skills before starting:

- `git-worktree`
- `git-branch-cleaner`
- `git-commit-messages`

## Execution Sequence

### 1. Provisioning

Delegate environment creation for each task to **`git-expert`**:

```bash
git worktree add -b task/{task-id} .trees/{task-id}/ {base}
```

### 2. Implementation (Parallel)

Launch one **`code-only`** agent per task in parallel.

- Each agent must work **only** inside `.trees/{task-id}/`.

### 3. Validation and Repair

Delegate per-task validation of each worktree to **`code-smoke`**.

- **Repair loop (max 3 attempts per task):**
  1. On failure, analyze the error and relaunch `code-only` in that worktree.
  2. Re-run `code-smoke`.
  3. If it still fails after 3 attempts, mark the task as failed and require manual review. **Never merge a failed task.**

### 4. Merge

For every validated task, delegate integration into the base branch to **`git-expert`**:

```bash
git checkout {base}
git merge --no-ff task/{task-id}
```

### 5. Cleanup

Delegate temporary environment cleanup to **`git-expert`**:

```bash
git worktree remove .trees/{task-id}/
git branch -D task/{task-id}
git worktree prune
```
