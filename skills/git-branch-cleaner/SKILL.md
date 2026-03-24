---
name: git-branch-cleaner
description: Procedures for cleaning Git branch history via rebasing and squashing commits.
version: 1.0.0
---

# Git Branch Cleaner

## ⚠️ Critical Constraints

- **NO INTERACTIVE COMMANDS**: Never use `git rebase -i`. It requires interactive input and will hang the execution environment.
- **ABORT ON CONFLICT**: If a rebase conflicts, immediately run `git rebase --abort`, report the conflicting files to the user, and halt execution.

## Execution Procedure

### 1. Preparation

- Synchronize remote state: `git fetch origin`
- Determine the target base branch by checking existence in this priority order: `release/next` > `develop` > `main` (or `master`).

### 2. Rebase

- Rebase the current branch onto the target: `git rebase origin/<target_branch>`
- *(If conflicts occur, follow the Abort on Conflict constraint).*

### 3. Squash (Non-Interactive)

If the branch contains multiple commits and requires squashing:

- Soft reset to the new base: `git reset --soft origin/<target_branch>`
- Create a single unified commit: `git commit -m "<type>: <description>"` (Ensure the message follows Conventional Commits and summarizes all changes).

### 4. Verification

- Confirm clean history: `git log --oneline -n 5`
- Confirm clean working tree: `git status`
