---
name: commit-push
description: Commit and push changes with ticket reference.
---

$1

**INSTRUCTION FOR DELEGATION:**
Immediately delegate to **git-expert** with the following instruction:
"Analyze the current changes in the working tree. Determine if they span multiple distinct domains (e.g., different features, fixes, or scopes). If so, split them into coherent multiple commits. Generate proper Conventional Commit messages. Include the ticket ID '$1' in the footer if provided or found in the branch name (format: ref: TICKET-ID). Push all commits to origin when complete."

**DO NOT** analyze git status or diff yourself. git-expert will perform the full analysis and decision-making.
