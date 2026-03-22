# OpenCode Workflows

Two AI-powered workflows for software engineering: **rocket** for implementation, **rocket-review** for code auditing. Both rely on strict delegation to specialized subagents rather than monolithic execution.

---

## Architecture Philosophy

Every design choice in these workflows serves one or more of these principles:

- **Structural enforcement over prompt-based rules** — If an agent shouldn't do something, remove the capability. Don't just ask nicely. rocket has no access to `edit`/`write` tools, making it physically impossible to code directly — far more reliable than a prompt instruction saying "please don't code."
- **Context hygiene** — LLM context windows are finite and precious. The orchestrator (rocket) never loads full diffs or file contents. It delegates, receives concise reports, and moves on. This prevents context pollution and keeps the orchestrator sharp across long multi-task sessions.
- **Constraints-first prompting** — Critical rules are placed at the top of every prompt, before the workflow description. LLMs exhibit primacy bias — instructions read first are followed more reliably, especially by smaller models.
- **English prompts, localized responses** — All system prompts and subagent instructions are written in English for maximum instruction-following accuracy across model sizes. The orchestrator responds to the user in French via an explicit language directive.
- **Single responsibility per agent** — Each subagent does exactly one thing. `code-only` codes. `code-smoke` validates. No agent wears multiple hats. This reduces hallucination and improves output quality.
- **Fail-fast with bounded retries** — Every implementation task has a max 3-attempt loop with smoke checks. If it can't be fixed in 3 tries, the system stops and asks for human help instead of spiraling.

---

## Agents & Subagents

### Primary Agents (User-Facing)

| Agent | Role |
|---|---|
| **rocket** | Tech Lead & orchestrator. Designs, plans, delegates, supervises. Never codes directly. |
| **rocket-review** | Audit orchestrator. Analyzes diffs via parallel specialized audits and produces actionable reports. |

### Subagents (Internal Specialists)

| Agent | Role | Used by |
|---|---|---|
| **explore** | Mandatory codebase exploration and context gathering. | rocket |
| **architect** | Mandatory design authority for features/enhancements/structural changes. Read-only analysis. | rocket |
| **bugfinder** | Root-cause investigation for complex bugs and unclear failures. Read-only analysis. | rocket |
| **code-only** | Implements code changes from structured specs. Responds "DONE" or "ERROR". | rocket |
| **code-smoke** | Unified validation agent: per-task (syntax+lint) and final (syntax+lint+tests+build). Reports diagnostics, never fixes. | rocket |
| **worktree-manager** | Creates/cleans isolated Git worktrees for opt-in parallel execution with file overlap. | rocket |
| **git-expert** | Git operations: merge, commit, push, rebase, history cleanup. Invoked only on explicit user request. | rocket (on-demand), worktree flow |
| **router-review** | Triage agent. Analyzes diffs and selects relevant audit focuses. | rocket-review |
| **code-audit** | Specialized auditor. One instance per focus (Security, Perf, Logic, etc.). | rocket-review |
| **critic-review** | Senior auditor. Consolidates audit reports, challenges findings, filters false positives. | rocket-review |

---

## rocket Workflow

rocket takes a request, decomposes it into micro-tasks, and executes through strict delegation with explicit gates. The orchestrator never writes code itself.

### Phase 1 — Exploration (Mandatory Delegation)

Runs automatically at the beginning and is never skipped:

- Delegates to `explore` to inspect stack, architecture, scripts, and key file patterns
- Builds context from project conventions and constraints
- Reports a concise project understanding before planning

### Phase 2 — Planning & Success Criteria (Interactive)

Collaborative planning with explicit design delegation:

1. **Clarify** — rocket refines scope, assumptions, and measurable outcomes with the user.
2. **Design Delegation** — rocket calls `architect` for all features/enhancements/structural changes (mandatory).
3. **Bug Investigation (when needed)** — rocket calls `bugfinder` for unclear root causes.
4. **Propose** — rocket presents ordered micro-tasks (T1, T2...) with file scope and success criteria.
5. **Validate** — execution starts only after explicit user approval ("Go" / "Validé").

### Phase 3 — Execution Strategy Selection (Automatic)

Before coding, rocket chooses the safest execution mode:

- **Dependency analysis**: if tasks depend on each other → sequential mode
- **File overlap analysis**: if tasks touch the same files → user chooses sequential or worktree-parallel
- **Default mode**: if independent and no overlap → parallel mode in the main workspace

### Phase 4 — Sequential Execution (When Required)

Used when dependencies exist (or user requests sequential). For each task `Tn`:

1. rocket prepares a structured implementation prompt (Context, Files, Specs, Success Criteria).
2. `code-only` implements the task.
3. rocket verifies that real file changes exist (`git diff --stat`).
4. `code-smoke` runs scoped validation.
5. On smoke failure, rocket retries with correction context (max 3 attempts, then stop and escalate to user).

### Phase 4b — Parallel Execution (DEFAULT)

Used when tasks are independent and file scopes do not overlap:

- rocket launches multiple `code-only` tasks concurrently in the same workspace
- Verifies aggregate changes
- Runs `code-smoke` per task
- Retries only failing tasks (bounded to 3 attempts per task)

### Phase 5 — Global Validation (MANDATORY)

After all tasks complete, rocket calls `code-smoke` in "final" mode for complete validation (syntax check, lint, full test suite, build). `code-smoke` provides detailed diagnostic reports on failure, and rocket handles retry loops with enriched context.

### Phase 6 — Closure

rocket returns the final implementation report and confirms changes are local. Any commit/push/rebase action is delegated to `git-expert` only when the user explicitly asks.

![rocket Workflow](./assets/rocket-workflow.svg)

### Why This Works

- **Delegation by construction** — architecture, coding, smoke checks, QA, and Git ops are split across purpose-built agents.
- **Design quality upfront** — `architect` is mandatory for feature/enhancement design before implementation begins.
- **Adaptive execution speed** — automatic routing to sequential, parallel, or worktree-parallel based on dependencies and overlap.
- **Two-level quality gates** — fast per-task smoke checks plus mandatory Global Validation prevent regressions and drift.
- **Bounded failure model** — retries are capped (max 3) and complex failures escalate instead of looping endlessly.

---

## rocket-review Workflow

rocket-review is a specialized pipeline for code auditing and pull request reviews. It analyzes changes from multiple expert perspectives concurrently, then consolidates findings into a single actionable report.

### How It Works

1. **Triage** — `router-review` analyzes the Git diff and selects which audit focuses are relevant (e.g., a CSS change won't trigger a Security audit).
2. **Parallel Audits** — Multiple `code-audit` instances run concurrently, each focused on a single aspect.
3. **Consolidation** — `critic-review` consolidates all audit reports, challenges findings, resolves contradictions, and filters false positives.
4. **Final Report** — A comprehensive review report is delivered to the user.

![rocket-review Workflow](./assets/rocket-review-workflow.svg)

### Audit Focus Types

Only relevant focuses are triggered based on the nature of the changes:

| Focus | What it checks |
|---|---|
| Security | Vulnerabilities, insecure data handling, potential exploits |
| Performance | Bottlenecks, inefficient algorithms, memory leaks |
| Style | Coding standards, naming conventions, formatting |
| Logic | Business logic correctness, algorithmic accuracy |
| Architecture | Structural design, patterns, system integration |
| Accessibility | WCAG compliance in UI changes |
| Testing | Test coverage, test quality, edge-case handling |

### Why This Works

- **Deeper expertise** — Each auditor has a single focus, leading to more thorough findings than a generalist pass.
- **Reduced hallucination** — Narrow scope means less cognitive load per agent, producing higher-confidence results.
- **Speed** — Parallel execution makes the review faster than sequential analysis of the same depth.
- **Cost-efficiency** — Only relevant audits are triggered. A typo fix doesn't spawn a security review.
- **Better signal-to-noise** — `critic-review` acts as a senior filter, ensuring only actionable feedback reaches the user.

---

## rocket-review to rocket Handoff

The two workflows can be chained. When `rocket-review` completes its audit, it produces a **rocket Implementation Brief** — a structured document containing:

- Prioritized list of issues found
- Suggested fixes with technical context
- Severity classification

This brief can be passed directly to `rocket` as input for a new implementation session. rocket will treat it as the initial requirement, skip to Phase 2 (Design & Planning), and propose a task breakdown to address the findings. This creates a closed loop: **Review → Brief → Implementation → Review**.
