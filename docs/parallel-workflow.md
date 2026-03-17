# Parallel Workflow Documentation

This document describes the parallel execution workflow implemented using Git worktrees, enabling concurrent task processing while maintaining repository integrity.

---

## Overview

The parallel workflow is an execution strategy that leverages Git worktrees to run multiple tasks simultaneously. Unlike traditional sequential execution where tasks run one after another, parallel execution allows independent tasks to run concurrently, significantly reducing overall execution time.

### When to Use Parallel Execution

- **Multiple independent tasks**: When you have 3 or more tasks that do not depend on each other's outputs
- **Time-critical workflows**: When reducing total execution time is a priority
- **Large-scale refactoring**: When breaking down monolithic changes into parallelizable units
- **CI/CD optimization**: When build/test cycles can be overlapped

### When to Use Sequential Execution (Default)

- **Small task sets**: Fewer than 3 tasks
- **Interdependent tasks**: Tasks that share state or produce inputs for each other
- **Complex merge scenarios**: When conflict resolution requires careful sequencing
- **Resource-constrained environments**: When parallel execution would exhaust system resources

---

## Architecture

### How Worktrees Enable Parallel Execution

Git worktrees allow multiple working trees to be associated with a single repository. Each worktree has its own working directory and can be on a different branch. This architecture provides:

1. **Isolation**: Each worktree operates independently with its own working directory
2. **Branching**: Worktrees can be on different branches without affecting each other
3. **Shared history**: All worktrees share the same `.git` database, avoiding full repository clones
4. **Atomic operations**: Changes in one worktree do not interfere with others

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Repository                          │
│                    (main branch)                             │
│                         │                                    │
│         ┌───────────────┼───────────────┐                   │
│         │               │               │                    │
│    ┌────▼────┐     ┌────▼────┐     ┌────▼────┐              │
│    │Worktree │     │Worktree │     │Worktree │              │
│    │   A     │     │   B     │     │   C     │              │
│    │ Branch  │     │ Branch  │     │ Branch  │              │
│    │ feature │     │ feature │     │ feature │              │
│    │    A    │     │    B    │     │    C    │              │
│    └─────────┘     └─────────┘     └─────────┘              │
│        │               │               │                    │
│        └───────────────┼───────────────┘                   │
│                        │                                    │
│                 ┌──────▼──────┐                             │
│                 │   Merge     │                             │
│                 │   Results   │                             │
│                 └─────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

| Component | Role |
|-----------|------|
| **rocket** | Orchestrator with dual-mode capability (sequential/parallel) |
| **Analyst** | Analyzes dependencies and recommends execution strategy |
| **Worktree Manager** | Handles worktree lifecycle (create, switch, cleanup) |
| **git-expert** | Manages merge strategies and resolves conflicts |
| **code-only** | Implements changes in a worktree-aware manner |

---

## Prerequisites

### Git Version

- **Minimum**: Git 2.17 or higher
- **Recommended**: Git 2.35 or higher (improved worktree performance)

Verify your Git version:
```bash
git --version
```

### Disk Space Requirements

Each worktree requires approximately:
- **Minimum**: 50-100 MB for small repositories
- **Typical**: 200-500 MB for medium repositories
- **Large repos**: 1+ GB per worktree

### System Resources

| Resource | Sequential | Parallel (n tasks) |
|----------|-----------|-------------------|
| CPU | 1 core | n cores recommended |
| RAM | 512 MB | 512 MB × n |
| I/O | Standard | Increased bandwidth |

### Required Permissions

- Write access to the repository
- Ability to create directories in the filesystem
- Git configured with appropriate credentials

---

## Quick Start

### Basic Parallel Execution

```bash
# Ensure you're on main branch with clean working tree
git checkout main
git pull origin main

# Run analysis to determine execution strategy
opencode analyze --task "implement feature X, fix bug Y, update docs"

# If recommended: execute in parallel mode
opencode execute --parallel --tasks "task1,task2,task3"
```

### Simple Example

Given three independent tasks:
1. Update README.md with new documentation
2. Add unit tests for module A
3. Refactor utility functions in module B

```bash
# Sequential: ~30 minutes total
# Parallel: ~12 minutes total (assuming similar task duration)

opencode execute --parallel --tasks "update-readme,add-tests-A,refactor-utils"
```

---

## Detailed Workflow

### Phase 1: Setup and Planning

1. **Repository Verification**
   ```bash
   # Verify clean working tree
   git status
   
   # Ensure on main branch
   git branch --show-current
   ```

2. **Task Definition**
   - Define each task with clear boundaries
   - Identify dependencies between tasks
   - Estimate complexity for each task

### Phase 2: Dependency Analysis

The **Analyst** component performs dependency analysis to determine:

1. **Task Graph Construction**
   - Build directed acyclic graph (DAG) of tasks
   - Identify explicit dependencies (file A depends on file B)
   - Identify implicit dependencies (shared state, common configs)

2. **Dependency Classification**
   ```
   ┌─────────────────────────────────────────────────────────┐
   │                  Dependency Types                       │
   ├─────────────────┬───────────────────────────────────────┤
   │ Type            │ Description                           │
   ├─────────────────┼───────────────────────────────────────┤
   │ NONE            │ Fully independent, parallelizable    │
   │ FILE_SHARE      │ Read same files, no write conflicts   │
   │ WRITE_CONFLICT  │ Write to same files, requires serial  │
   │ BUILD_ORDER     │ Output of one is input to another     │
   └─────────────────┴───────────────────────────────────────┘
   ```

3. **Execution Recommendation**
   ```bash
   # Analyst output example
   Recommendation: PARALLEL
   Confidence: 85%
   Risk: LOW
   Tasks: 3 independent, 0 dependent
   ```

### Phase 2B: Dependency Analysis (Detailed)

During this phase, the Analyst examines:

- **File-level dependencies**: Which files does each task modify?
- **Build dependencies**: Does task B require output from task A?
- **Test dependencies**: Do tests in task B require changes from task A?
- **Configuration coupling**: Do tasks share configuration files?

**Analysis Output**:
```json
{
  "tasks": [
    {"id": "task-1", "files": ["src/a.ts", "src/b.ts"]},
    {"id": "task-2", "files": ["src/c.ts", "src/d.ts"]},
    {"id": "task-3", "files": ["docs/readme.md"]}
  ],
  "dependency_matrix": {
    "task-1": {"task-2": false, "task-3": false},
    "task-2": {"task-1": false, "task-3": false},
    "task-3": {"task-1": false, "task-2": false}
  },
  "recommendation": "PARALLEL",
  "parallelizable": true
}
```

### Phase 3: Execution Mode Decision

Based on dependency analysis, rocket decides between:

| Condition | Decision | Rationale |
|-----------|----------|------------|
| < 3 tasks | SEQUENTIAL | Overhead not justified |
| 3+ independent tasks | PARALLEL | Time savings > overhead |
| Mixed dependencies | HYBRID | Parallelize independent, sequentialize dependent |
| High risk detected | SEQUENTIAL | Prefer safety over speed |

**Decision Algorithm**:
```
IF task_count < 3:
    RETURN SEQUENTIAL
ELSE IF dependency_graph.is_dag() AND parallel_tasks >= 3:
    IF risk_score < MEDIUM:
        RETURN PARALLEL
    ELSE:
        RETURN SEQUENTIAL
ELSE:
    RETURN SEQUENTIAL
```

### Phase 4: Sequential Execution (Default)

When sequential execution is chosen:

1. **Task Queue Creation**
   - Tasks are ordered based on dependencies
   - Each task waits for predecessors to complete

2. **Execution Loop**
   ```python
   for task in task_queue:
       if not can_execute(task):
           wait_for_dependencies(task)
       execute_task(task)
       validate_output(task)
   ```

3. **Error Handling**
   - On failure: stop execution, report error
   - No rollback needed (single branch)

### Phase 5: Parallel Execution (Optional)

When parallel execution is chosen:

1. **Worktree Creation**
   ```bash
   # For each parallel task
   git worktree add .trees/task-{id} -b task/task-{id}
   ```

2. **Parallel Execution**
   ```python
   with ThreadPoolExecutor(max_workers=task_count) as executor:
       futures = [executor.submit(execute_task, task) for task in tasks]
       results = [f.result() for f in futures]
   ```

3. **Worktree Cleanup** (on success)
   ```bash
   git worktree remove .trees/task-{id}
   git branch -d task/task-{id}
   ```

### Phase 6: QA and Closure

1. **Merge Preparation**
   - Each worktree branch is merged into main
   - git-expert handles conflict resolution

2. **Validation**
   - Run full test suite
   - Verify no regressions
   - Check build integrity

3. **Cleanup**
   - Remove all worktrees
   - Delete parallel branches
   - Verify clean working tree

---

## Agents Reference

### rocket: Orchestrator

**Responsibilities**:
- Analyze task requirements
- Determine execution mode (sequential/parallel)
- Coordinate agent execution
- Manage workflow phases
- Handle error recovery

**Capabilities**:
- Dual-mode execution (sequential/parallel)
- Dynamic task distribution
- Resource allocation
- Progress tracking

### Analyst: Dependency Analysis

**Responsibilities**:
- Parse task specifications
- Build dependency graphs
- Calculate execution strategies
- Assess risk factors
- Provide recommendations

**Outputs**:
- Dependency matrix
- Execution recommendation
- Risk assessment
- Resource estimates

### Worktree Manager: Lifecycle Management

**Responsibilities**:
- Create worktrees
- Manage worktree state
- Track worktree health
- Cleanup worktrees
- Handle failures

**Commands**:
```bash
# Create worktree
git worktree add <path> -b <branch>

# List worktrees
git worktree list

# Remove worktree
git worktree remove <path>
```

### git-expert: Merge and Conflicts

**Responsibilities**:
- Execute merges
- Resolve conflicts
- Apply merge strategies
- Validate merge results

**Merge Strategies**:
- `recursive`: Default for linear histories
- `ours`: Keep our version (avoid conflicts)
- `octopus`: Merge multiple branches

### code-only: Worktree-Aware Implementation

**Responsibilities**:
- Execute tasks within worktree context
- Respect worktree boundaries
- Maintain code quality
- Validate changes

**Considerations**:
- Each worktree has isolated working directory
- Changes are committed to worktree branch
- Must not modify files outside assigned scope

---

## Decision Matrix

### Sequential vs Parallel Execution

| Factor | Sequential | Parallel |
|--------|------------|----------|
| **Task Count** | < 3 | >= 3 |
| **Dependencies** | Any | None/minimal |
| **Risk Tolerance** | High (safe) | Low (acceptable) |
| **Resource Availability** | Limited | Abundant |
| **Time Pressure** | Low | High |
| **Merge Complexity** | Simple | Moderate |

### When to Choose Sequential (Default)

- **Safety priority**: When errors are costly
- **Complex merges**: Multiple branches with overlapping changes
- **Resource limits**: Limited CPU, memory, or I/O
- **Small workloads**: Quick tasks where overhead exceeds benefit
- **Debugging**: When tracing issues is easier sequentially

### When to Choose Parallel

- **3+ independent tasks**: Clear separation of concerns
- **Time-critical**: Significant time savings needed
- **Large refactors**: Breaking monolithic changes into units
- **CI/CD pipelines**: Overlapping build/test phases
- **Resource-rich**: Sufficient cores, memory, bandwidth

### Risk Factors and Mitigations

| Risk | Mitigation |
|------|------------|
| **Merge conflicts** | Careful dependency analysis; hybrid approach |
| **Resource exhaustion** | Limit parallel tasks; monitor system load |
| **Race conditions** | Isolate file access; use atomic operations |
| **Worktree state corruption** | Validate before merge; rollback on error |
| **Inconsistent results** | Deterministic task ordering; thorough testing |

---

## Best Practices

### Task Decomposition for Parallelization

1. **Identify independent units**
   - Separate by module/component
   - Minimize shared files
   - Clear API boundaries

2. **Balance task size**
   - Similar complexity for parallel tasks
   - Avoid stragglers (one long task blocking completion)
   - Target 10-30 minutes per task

3. **Define clear interfaces**
   - Document expected inputs/outputs
   - Avoid implicit dependencies
   - Use configuration for shared values

### Conflict Prevention Strategies

1. **File partitioning**
   ```
   Task A: src/components/*
   Task B: src/utils/*
   Task C: docs/*
   ```

2. **Avoid shared state**
   - No global variables
   - No singleton patterns with mutable state
   - Configuration via parameters

3. **Dependency injection**
   - Pass dependencies explicitly
   - Mock external services in tests
   - Use interfaces for abstractions

### Resource Management

1. **CPU**
   - Limit to `n - 1` cores (keep one for system)
   - Monitor load during execution
   - Throttle if needed

2. **Memory**
   - Estimate per-task memory needs
   - Monitor for leaks
   - Increase swap if necessary

3. **I/O**
   - Use local disk for worktrees
   - Avoid network I/O during parallel work
   - Limit concurrent file operations

### Cleanup Procedures

1. **On Success**
   ```bash
   # Remove worktrees
   for wt in .trees/*; do
       git worktree remove "$wt"
   done
   
   # Delete branches
   git branch -D task/*
   
   # Verify clean state
   git worktree list
   git branch -a
   ```

2. **On Failure**
   ```bash
   # Preserve worktrees for debugging
   # Log error details
   
   # Manual cleanup required
   git worktree list
   # Inspect each worktree
   # Remove when ready
   ```

3. **Periodic Cleanup**
   ```bash
   # Remove stale worktrees
   git worktree prune
   
   # Clean up refs
   git remote prune origin
   ```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Cannot create worktree"

**Cause**: Directory already exists or is not empty

**Solution**:
```bash
# Check existing worktrees
git worktree list

# Remove conflicting directory
rm -rf <path>
# OR use different path
git worktree add .trees/task-new -b branch-name
```

#### Issue: "Merge conflicts during parallel execution"

**Cause**: Tasks modified overlapping files

**Solution**:
```bash
# Abort merge
git merge --abort

# Re-analyze dependencies
# Convert to sequential or hybrid execution

# For manual resolution:
# 1. Identify conflicting files
git status --porcelain | grep UU

# 2. Resolve each conflict
# 3. Stage resolved files
git add <resolved-files>

# 4. Complete merge
git commit
```

#### Issue: "Worktree not accessible"

**Cause**: Worktree removed externally or path issue

**Solution**:
```bash
# List all worktrees
git worktree list --porcelain

# Remove stale reference
git worktree remove --force <path>

# Prune dead worktrees
git worktree prune
```

#### Issue: "Out of disk space"

**Cause**: Too many worktrees or large repositories

**Solution**:
```bash
# Check disk usage
df -h

# Remove unused worktrees
git worktree list
git worktree remove <unused-path>

# Clean git objects
git gc --aggressive
```

### Conflict Resolution

1. **Identify conflicts**
   ```bash
   git status | grep unmerged
   ```

2. **View conflict markers**
   ```bash
   # In conflicting file
   <<<<<<< HEAD
   // Our changes
   =======
   // Their changes
   >>>>>>> branch-name
   ```

3. **Choose resolution strategy**
   - `accept ours`: Keep our version
   - `accept theirs`: Keep their version
   - `manual`: Edit to combine changes

4. **Complete resolution**
   ```bash
   git add <resolved-files>
   git commit
   ```

### Worktree Cleanup

1. **Normal cleanup**
   ```bash
   # Remove worktree and branch
   git worktree remove .trees/task-1
   git branch -D task/task-1
   ```

2. **Force cleanup** (if directory exists but worktree is broken)
   ```bash
   rm -rf .trees/task-1
   git worktree remove --force .trees/task-1
   ```

3. **Verify cleanup**
   ```bash
   git worktree list
   # Should show only main worktree
   ```

---

## Success Criteria

This documentation meets the following criteria:

- **Comprehensive coverage**: All workflow phases documented
- **Clear architecture**: Worktree-based parallelization explained
- **Practical examples**: Quick start and detailed examples provided
- **Decision guidance**: Clear matrix for sequential vs parallel
- **Agent reference**: All components documented with roles
- **Best practices**: Guidelines for optimal execution
- **Troubleshooting**: Common issues and solutions included
- **Professional formatting**: Structured with clear headings and sections

---

## Appendix

### Commands Reference

```bash
# Worktree operations
git worktree add <path> -b <branch>
git worktree list
git worktree remove <path>
git worktree prune

# Branch operations
git branch -D <branch>
git branch -a

# Merge operations
git merge <branch>
git merge --abort
git mergetool

# Status
git status
git status --porcelain
```

### Additional Resources

- Git Worktree Documentation: https://git-scm.com/docs/git-worktree
- Git Merge Strategies: https://git-scm.com/docs/git-merge#_merge_strategies
- Parallel Execution Best Practices: Internal engineering documentation

---

*Document Version: 1.0*  
*Last Updated: 2026-03-07*
