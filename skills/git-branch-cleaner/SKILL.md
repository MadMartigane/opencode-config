---
name: git-branch-cleaner
description: Procedures for cleaning Git branch history via rebasing and squashing commits.
version: 1.0.0
---

# Git Branch Cleaner

## ⚠️ Critical Constraints

- **NO INTERACTIVE COMMANDS**: Never use `git rebase -i`. It requires interactive input and will hang the execution environment.
- **ABORT ON CONFLICT**: If a rebase conflicts, immediately run `git rebase --abort`, report the conflicting files to the user, and halt execution.

## Destructive Operations Safety Protocol

The following operations are classified as **destructive**:
- squash
- rebase
- reset
- force-push
- branch deletion
- merge history rewrite

All destructive operations MUST follow this mandatory two-phase protocol:

### Phase 1 — PRECHECK ONLY

- The agent MUST NOT execute any destructive command during this phase.
- The agent MUST gather and report:
  - current branch name
  - resolved target/base branch
  - upstream tracking branch (or "none")
  - exact commit count since merge-base with target
  - exact list of commits to be rewritten, as abbreviated hashes + subjects
  - whether merge commits are present in the rewrite range
  - whether remote branch exists
  - whether push would require `--force` or `--force-with-lease`
  - exact Git commands planned for execution

### Phase 2 — EXECUTE

- The agent may execute destructive commands ONLY when the caller explicitly authorizes execution after the PRECHECK.
- Authorization token must be textual, not interactive. Require the caller instruction to contain one of:
  - `APPROVED-DESTRUCTIVE-GIT`
  - `EXECUTE-DESTRUCTIVE-GIT`
- If the token is absent, the agent MUST stop after the PRECHECK report.

### Mandatory STOP conditions

- actual commit count differs from caller expectation
- caller expectation is missing for squash/rebase scope
- merge commits exist in the rewrite range
- base branch cannot be resolved unambiguously
- branch has no upstream and push intent is implied
- force-push would be required but no explicit approval token is present
- requested rewrite scope is ambiguous ("all commits", "clean history", etc.) without numeric or hash-bounded confirmation
- remote state changed between PRECHECK and EXECUTE

On STOP, the agent output must:
- state `STOPPED`
- state the exact reason
- state the exact next user/caller action required

### Hard rule

- NEVER run `git push --force`
- If push after history rewrite is explicitly approved, use only:
  `git push --force-with-lease`

## Execution Procedure

### 1. Preparation

- Synchronize remote state: `git fetch origin --prune`
- Determine the target base branch by checking existence in this priority order: `release/next` > `develop` > `main` (or `master`).

### 2. Rebase

- **Do not execute `git rebase origin/<target_branch>` until the PRECHECK phase is completed and explicitly approved.**
- If rebase is approved and executed, and conflicts occur, follow the Abort on Conflict constraint.

### 2.5 Pre-validation before any rewrite

Before any squash or rebase, perform these exact checks:

1. `git fetch origin --prune`
2. Resolve target branch by priority:
   - `release/next`
   - `develop`
   - `main`
   - `master`
3. Compute merge-base with `origin/<target_branch>`
4. Count commits in rewrite scope: `git rev-list --count <merge-base>..HEAD`
5. List commits in rewrite scope: `git log --oneline <merge-base>..HEAD`
6. Detect merge commits in rewrite scope: `git rev-list --merges <merge-base>..HEAD`
7. Determine whether upstream exists and whether post-rewrite push would require `--force-with-lease`

**Guard rules:**
- Do not execute `git rebase origin/<target_branch>` until PRECHECK is completed and approved.
- Do not execute `git reset --soft origin/<target_branch>` until PRECHECK is completed and approved.
- If commit count is greater than the caller-approved count, STOP.
- If caller-approved hashes or count are unavailable, STOP.
- If merge commits are present in the rewrite range, STOP and require explicit human-reviewed scope confirmation.
- If remote push after rewrite is needed, require explicit approval for `git push --force-with-lease`.
- Never mention or use `git push --force`.

### 3. Squash (Non-Interactive)

If the branch contains multiple commits and requires squashing, **and only after PRECHECK approval**:

- Soft reset to the new base: `git reset --soft origin/<target_branch>`
- Create a single unified commit: `git commit -m "<type>: <description>"` (Ensure the message follows Conventional Commits and summarizes all changes).

### 4. Verification

- Verify rewritten history: `git log --oneline --decorate -n 10`
- Verify working tree: `git status`
- Verify remote push mode is either normal push or approved `git push --force-with-lease`
