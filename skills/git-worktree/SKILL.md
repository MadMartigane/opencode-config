---
name: git-worktree
description: Git worktree operations for parallel sub-agent execution and task isolation.
version: 1.0.0
---

# Skill: Git Worktree

Git worktrees allow multiple working directories attached to a single repository. Use this skill to isolate parallel sub-agent tasks, preventing branch conflicts and working directory contamination.

## ⚠️ Critical Agent Constraints

- **NO INTERACTIVE TOOLS**: Never use `git mergetool` or commands requiring interactive input.
- **ISOLATION**: Never checkout the same branch in multiple worktrees simultaneously.
- **LOCATION**: Always create worktrees as sibling directories to the main repository (e.g., `../project-task123`) to avoid nested `.git` issues.
- **SAFETY**: Never attempt to remove the main worktree (the first entry in `git worktree list`).

## 1. Standard Agent Workflow

Execute these steps sequentially to manage a parallel task.

### Phase A: Setup

1. **Verify state & branch availability:**

   ```bash
   git worktree list
   git branch -a | grep <new-branch-name>
   ```

2. **Create isolated worktree & branch:**

   ```bash
   # Format: git worktree add -b <new-branch> <sibling-path>
   git worktree add -b task/agent-1 ../project-agent-1
   ```

3. **Prepare dependencies (if applicable):**
   Navigate to the new worktree and install dependencies if required by the project (e.g., `npm install`).

### Phase B: Execution

Instruct the sub-agent to perform its work exclusively inside the new worktree directory (`../project-agent-1`).

### Phase C: Merge & Cleanup

Once the sub-agent completes its task and commits changes:

1. **Return to main repository and prepare:**

   ```bash
   cd <main-repo-path>
   git checkout main
   git pull origin main
   ```

2. **Merge the agent's work:**

   ```bash
   git merge task/agent-1
   ```

   *(If conflicts occur, see Conflict Resolution below).*
3. **Cleanup worktree and branch:**

   ```bash
   git worktree remove ../project-agent-1
   git branch -d task/agent-1
   git worktree prune
   ```

## 2. Conflict Resolution (Non-Interactive)

If `git merge` fails due to conflicts, resolve them programmatically:

1. **Identify conflicted files:**

   ```bash
   git diff --name-only --diff-filter=U
   ```

2. **Resolve conflicts:**
   - Read the file and locate standard conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
   - Use file editing tools to manually combine changes and remove all markers.
3. **Finalize merge:**

   ```bash
   git add <resolved-file>
   git commit --no-edit
   ```

4. **Abort (if resolution is too complex):**

   ```bash
   git merge --abort
   ```

## 3. Worktree Management Commands

| Operation | Command |
| :--- | :--- |
| **List** | `git worktree list` |
| **Add (Existing Branch)** | `git worktree add <path> <branch>` |
| **Add (New Branch)** | `git worktree add -b <new-branch> <path>` |
| **Remove (Clean)** | `git worktree remove <path>` |
| **Remove (Force/Dirty)**| `git worktree remove --force <path>` |
| **Prune Stale** | `git worktree prune` |
