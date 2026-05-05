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

## Instructions for git-expert

Ask it explicitly to:

1. Analyze all current changes.
2. Generate an appropriate commit message following conventions.
3. Commit the changes.
4. Push the result to the remote repository.
