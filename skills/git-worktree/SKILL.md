---
name: git-worktree
description: Git worktree operations for parallel sub-agent execution and task isolation.
version: 1.0.0
---

# Skill: Git Worktree

This skill provides comprehensive procedures for managing Git worktrees to enable parallel sub-agent execution and maintain isolated working directories for concurrent tasks.

## Overview

Git worktrees allow multiple working trees attached to a single repository. Each worktree can have its own branch, enabling parallel development without interfering with the main working directory.

## Worktree Lifecycle

### 1. Creating a Worktree

**Standard creation:**
```bash
git worktree add <path> <branch>
```

**Create and switch to new branch:**
```bash
git worktree add -b <new-branch-name> <path>
```

**Recommended directory conventions:**
- `.trees/<task-id>/` - Inside repository (requires .gitignore entry)
- `../<project>-<task-id>` - Sibling directory to main repo

**Example for task isolation:**
```bash
git worktree add ../myproject-task123 -b feature/task-123
```

### 2. Listing Worktrees

```bash
git worktree list
```

Output format shows path, branch, and HEAD state:
```
/home/mad/project          main                    abc123
/home/mad/project-task123 feature/task-123        def456 (detached)
```

### 3. Removing a Worktree

**Safe removal (must be clean):**
```bash
git worktree remove <path>
```

**Force removal (with uncommitted changes):**
```bash
git worktree remove --force <path>
```

**Remove and prune in one step:**
```bash
git worktree remove <path> && git worktree prune
```

### 4. Pruning Stale Worktrees

```bash
git worktree prune
```

Removes worktree directories that were manually deleted or are otherwise invalid. Automatically cleans up:
- Broken worktree references
- Lock files
- Dead HEAD entries

## Parallel Execution Patterns

### 1. Task Isolation Model

Each sub-agent receives its own worktree:
- **Branch**: Unique branch per task (e.g., `task/{agent-id}`)
- **Directory**: Isolated path outside main working tree
- **State**: Clean working directory at start/end

### 2. Workflow for Parallel Agents

**Main agent workflow:**
```bash
# 1. Create worktree for agent
git worktree add -b task/agent-1 ../project-agent1

# 2. Notify agent to work in directory
# Agent performs work...

# 3. After agent completes, merge changes
git checkout main
git merge task/agent-1

# 4. Remove worktree
git worktree remove ../project-agent1
git branch -d task/agent-1
```

### 3. Coordination Between Worktrees

- **Shared repo**: All worktrees share `.git` database
- **Branch uniqueness**: Each worktree should use unique branches
- **No concurrent writes**: Same branch should not be checked out in multiple worktrees

## Merge Strategies

### 1. Fast-Forward Merge

When target branch has not diverged:
```bash
git merge --ff-only task/agent-1
```

Fails if merge requires a commit (clean history preferred).

### 2. Three-Way Merge

Standard merge when branches have diverged:
```bash
git merge task/agent-1
```

Creates a merge commit automatically.

### 3. Octopus Merge

合并多个分支 at once:
```bash
git merge task/agent-1 task/agent-2 task/agent-3
```

Only succeeds if no conflicts between all branches.

### 4. git-imerge for Complex Merges

For complex histories or large parallel changes:
```bash
# Install: brew install git-imerge or pip install git-imerge
git imerge merge task/agent-1
```

Provides incremental merge with easier conflict resolution.

## Conflict Resolution

### 1. Detecting Conflicts

After merge attempt:
```bash
git status
```

Conflict markers in files:
```
<<<<<<< HEAD
main version
=======
task version
>>>>>>> task/agent-1
```

### 2. Resolution Process

**Step 1: Identify conflicts**
```bash
git diff --name-only --diff-filter=U
```

**Step 2: Edit each conflicted file**
- Keep desired changes from HEAD or incoming
- Or manually combine both

**Step 3: Stage resolved files**
```bash
git add <resolved-file>
```

**Step 4: Complete merge**
```bash
git commit
```

### 3. Abort Merge if Needed

```bash
git merge --abort
```

### 4. Using Merge Tools

```bash
git mergetool
```

Opens configured merge tool (vimdiff, kdiff3, etc.).

## Cleanup Procedures

### 1. Regular Pruning

Schedule periodic cleanup:
```bash
git worktree prune --expire=7.days.ago
```

### 2. Pre-Merge Checklist

Before merging worktree changes:
```bash
# Verify worktree is clean
git worktree list
cd <worktree-path>
git status

# Verify branch has expected commits
git log main..task/agent-1 --oneline
```

### 3. Post-Merge Cleanup

```bash
# Remove worktree directory
git worktree remove ../project-task123

# Delete branch
git branch -d task/agent-1

# Prune loose references
git worktree prune
```

## Resource Management

### 1. Disk Space

Worktrees share the `.git` object database, so disk overhead is minimal:
- Only working tree files are duplicated
- `.git` is shared across all worktrees

**Space estimation:**
```bash
du -sh <worktree-path>
```

### 2. node_modules Handling

**Recommended: Use shared node_modules**
```bash
# In worktree, use main project's node_modules
cd ..main-project
npm link package-name

# Or use workspaces
```

**Alternative: Separate node_modules**
```bash
# Add to worktree .gitignore
echo "node_modules/" >> .gitignore
```

### 3. Large File Management

If worktrees contain large files:
```bash
# Use git-lfs
git lfs install
git lfs track "*.large"

# Or use gitignore in worktree
```

## Best Practices

### 1. Naming Conventions

- **Branches**: `task/{agent-id}`, `feature/{task-id}`, `fix/{issue-id}`
- **Worktree paths**: `{project}-{branch-name}`, `../project-{task-id}`
- Avoid spaces and special characters

### 2. Worktree Isolation Rules

- Never checkout same branch in multiple worktrees
- Always clean worktree before removing
- Use unique branches per task
- Communicate branch assignments between agents

### 3. Error Prevention

- Check `git worktree list` before creating
- Verify branch doesn't exist before creating
- Ensure target directory doesn't exist
- Confirm main branch is up-to-date before merge

## Step-by-Step Procedure

### Creating Worktree for Agent

1. **Analyze current state**
   ```bash
   git status
   git worktree list
   ```

2. **Verify branch availability**
   ```bash
   git branch -a | grep task/
   ```

3. **Create worktree**
   ```bash
   git worktree add -b task/<agent-id> ../project-<agent-id>
   ```

4. **Verify creation**
   ```bash
   git worktree list
   ```

### Merging Agent Changes

1. **Switch to main branch**
   ```bash
   git checkout main
   ```

2. **Fetch latest**
   ```bash
   git fetch origin
   git pull origin main
   ```

3. **Verify changes**
   ```bash
   git log main..task/<agent-id>
   ```

4. **Merge**
   ```bash
   git merge task/<agent-id>
   ```

5. **Resolve conflicts if any**

6. **Push**
   ```bash
   git push origin main
   ```

### Cleanup

1. **Remove worktree**
   ```bash
   git worktree remove ../project-<agent-id>
   ```

2. **Delete branch**
   ```bash
   git branch -d task/<agent-id>
   ```

3. **Prune**
   ```bash
   git worktree prune
   ```

4. **Verify**
   ```bash
   git worktree list
   git branch -a
   ```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `git worktree add <path> <branch>` | Create worktree |
| `git worktree add -b <branch> <path>` | Create with new branch |
| `git worktree list` | List all worktrees |
| `git worktree remove <path>` | Remove worktree |
| `git worktree prune` | Clean stale worktrees |
| `git worktree lock <path>` | Lock worktree |
| `git worktree unlock <path>` | Unlock worktree |

## Safety Rules

1. **Always verify before removing** - Ensure worktree is clean or use `--force`
2. **Never delete main worktree** - First entry in `git worktree list` is main
3. **Avoid nested worktrees** - Don't create worktree inside another worktree
4. **Use unique branches** - Prevent conflicts by never sharing branch names
5. **Communicate** - Coordinate between agents to avoid branch collisions
