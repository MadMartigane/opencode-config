# OpenCode Workflows

Two AI-powered workflows for software engineering: **rocket** for implementation, **rocket-review** for code auditing. Both rely on strict delegation to specialized subagents rather than monolithic execution.

---

## Architecture Philosophy

Every design choice in these workflows serves one or more of these principles:

- **Structural enforcement over prompt-based rules** — If an agent shouldn't do something, remove the capability. Don't just ask nicely. rocket has no access to `edit`/`write` tools, making it physically impossible to code directly — far more reliable than a prompt instruction saying "please don't code."
- **Context hygiene** — LLM context windows are finite and precious. The orchestrator (rocket) never loads full diffs or file contents. It delegates, receives concise reports, and moves on. This prevents context pollution and keeps the orchestrator sharp across long multi-task sessions.
- **Constraints-first prompting** — Critical rules are placed at the top of every prompt, before the workflow description. LLMs exhibit primacy bias — instructions read first are followed more reliably, especially by smaller models.
- **English prompts, localized responses** — All system prompts and subagent instructions are written in English for maximum instruction-following accuracy across model sizes. The orchestrator responds to the user in French via an explicit language directive.
- **Single responsibility per agent** — Each subagent does exactly one thing. `code-only` codes. `code-smoke` validates. `code-cleaner` refines. No agent wears multiple hats. This reduces hallucination and improves output quality.
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
| **code-only** | Implements code changes from structured specs. Responds "DONE" or "ERROR". | rocket, code-cleaner |
| **code-smoke** | Fast scoped validation (lint, tsc, unit tests on changed files). Responds "SMOKE OK" or "SMOKE FAILED". | rocket |
| **code-cleaner** | Full QA: complete test suites, clean-code refinements, cross-task consistency. | rocket |
| **test-expert** | Runs tests and returns concise summaries. Isolates verbose test output from orchestrator context. | code-cleaner |
| **git-expert** | Git operations: conventional commits, rebasing, history cleanup. Invoked only on explicit user request. | On-demand |
| **router-review** | Triage agent. Analyzes diffs and selects relevant audit focuses. | rocket-review |
| **code-audit** | Specialized auditor. One instance per focus (Security, Perf, Logic, etc.). | rocket-review |
| **critic-review** | Senior auditor. Consolidates audit reports, challenges findings, filters false positives. | rocket-review |

---

## rocket Workflow

rocket takes a user request, breaks it into micro-tasks, and executes them through a supervised delegation loop with quality gates at every step.

### Phase 1 — Initialization & Analysis

Runs automatically on startup. rocket scans the project to build context:

- Reads guide files (`.cursor/rules/*.mdc`) for project-specific rules
- Analyzes `package.json` for stack, scripts, and dependencies
- Explores the directory structure and identifies architectural patterns
- Presents a concise summary to the user

### Phase 2 — Design & Planning

Interactive collaboration with the user:

1. **Clarify** — rocket discusses the requirement, states assumptions, presents alternatives if ambiguous, and pushes back on vague requests.
2. **Propose** — A technical solution with an ordered task breakdown (T1, T2, T3...). Each task is isolated and testable.
3. **Validate** — The user must explicitly approve the plan ("Go" / "Validé"). rocket will not proceed without approval.

### Phase 3 — Supervised Implementation

Once the plan is validated, rocket chains tasks autonomously without intermediate user approval:

```
For each task Tn:

  1. rocket prepares a structured prompt (Context, Files, Specs, Success Criteria)

  2. Implementation & Smoke Check loop (max 3 attempts):
     a. code-only implements the task
     b. rocket verifies physical changes exist (git diff --stat)
     c. code-smoke runs scoped validation
     d. SMOKE OK → next task | SMOKE FAILED → retry with error context

  3. If failed after 3 attempts → STOP, ask user for help
```

### Phase 4 — Full QA

Once all tasks pass their smoke checks, `code-cleaner` runs a single comprehensive QA pass:
- Full test suites (via `test-expert`)
- Clean-code refinements across the entire diff
- Cross-task consistency verification

### Phase 5 — Closure

rocket delivers a final report and signals that changes are ready to be versioned. The user decides when and how to commit — manually or by requesting `git-expert`.

![rocket Workflow](./assets/rocket-workflow.svg)

### Why This Works

- **No context pollution** — rocket never sees raw code or full diffs. It stays sharp across 10+ tasks in a single session.
- **Structural guardrails** — `edit`/`write` tools are disabled at the config level. Delegation isn't optional, it's enforced.
- **Quality at every step** — Smoke checks catch regressions immediately. Full QA catches cross-task issues. Two layers of defense.
- **Bounded failure** — 3-attempt max prevents infinite retry loops. Human escalation is built into the workflow.
- **Predictable execution** — The same loop runs for every task. No special cases, no shortcuts.

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
