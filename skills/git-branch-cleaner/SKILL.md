---
name: git-branch-cleaner
description: Procedures for cleaning Git branch history via rebasing and squashing commits.
version: 1.0.0
---

# Skill: Git Branch Cleaner

This skill provides procedures for cleaning Git branch history via rebasing and squashing commits.

## Capabilities

### 1. Branch Rebase
- Always perform `git fetch origin` before rebasing.
- Identify the target branch (base) priority: `release/next` > `develop` > `main`/`master`.
- Use `git rebase origin/<target_branch>`.
- On conflict: Stop and list conflicting files.

### 2. Commit Squash
- Calculate commits to squash from divergence point.
- Use soft reset: `git reset --soft HEAD~<N>` then `git commit`.
- Alternative: `git rebase -i` if supported.

## Step-by-Step Procedure
1. Analyze: `git status`, `git log --oneline -n 10`.
2. Identify base branch and unique commits.
3. Rebase onto base.
4. Squash if needed.
5. Verify: Tests pass, clean history.
