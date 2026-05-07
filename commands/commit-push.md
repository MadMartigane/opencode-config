---
name: commit-push
description: Delegate commit and push to git-expert
---

# Execution Directive

Immediately delegate the full commit-and-push workflow to `git-expert`.

## Delegation Rules

- **No Pre-Analysis**: Do not run any Git command yourself (`status`, `diff`, etc.). Leave all Git analysis to `git-expert`.
- **Direct Action**: Use the `task` tool immediately.
- **Delegation Language**: Write the subagent prompt in **English**.

## Destructive Operations Exclusion

This command MUST NOT be used for squash, rebase, reset, or force-push workflows.

If the user asks for history rewrite or push after rewrite, delegate **PRECHECK only** first.
- Instruct `git-expert`: "If this request implies history rewrite, perform PRECHECK only and stop unless APPROVED-DESTRUCTIVE-GIT is present."
- Wait for the PRECHECK report and user approval before requesting execution.

## Instructions for git-expert (Non-Destructive Commits)

Ask it explicitly to:

1. Analyze all current changes.
2. Generate an appropriate commit message following conventions.
3. Commit the changes.
4. Push the result to the remote repository.
