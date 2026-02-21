# OpenCode Workflows

Two AI-powered workflows for software engineering: **Rocket** for implementation, **Rocket-Review** for code auditing. Both rely on strict delegation to specialized subagents rather than monolithic execution.

---

## Architecture Philosophy

Every design choice in these workflows serves one or more of these principles:

- **Structural enforcement over prompt-based rules** — If an agent shouldn't do something, remove the capability. Don't just ask nicely. Rocket has no access to `edit`/`write` tools, making it physically impossible to code directly — far more reliable than a prompt instruction saying "please don't code."
- **Context hygiene** — LLM context windows are finite and precious. The orchestrator (Rocket) never loads full diffs or file contents. It delegates, receives concise reports, and moves on. This prevents context pollution and keeps the orchestrator sharp across long multi-task sessions.
- **Constraints-first prompting** — Critical rules are placed at the top of every prompt, before the workflow description. LLMs exhibit primacy bias — instructions read first are followed more reliably, especially by smaller models.
- **English prompts, localized responses** — All system prompts and subagent instructions are written in English for maximum instruction-following accuracy across model sizes. The orchestrator responds to the user in French via an explicit language directive.
- **Single responsibility per agent** — Each subagent does exactly one thing. `Code-Only` codes. `Code-Smoke` validates. `Code-Cleaner` refines. No agent wears multiple hats. This reduces hallucination and improves output quality.
- **Fail-fast with bounded retries** — Every implementation task has a max 3-attempt loop with smoke checks. If it can't be fixed in 3 tries, the system stops and asks for human help instead of spiraling.

---

## Agents & Subagents

### Primary Agents (User-Facing)

| Agent | Role |
|---|---|
| **Rocket** | Tech Lead & orchestrator. Designs, plans, delegates, supervises. Never codes directly. |
| **Rocket-Review** | Audit orchestrator. Analyzes diffs via parallel specialized audits and produces actionable reports. |

### Subagents (Internal Specialists)

| Agent | Role | Used by |
|---|---|---|
| **Code-Only** | Implements code changes from structured specs. Responds "DONE" or "ERROR". | Rocket, Code-Cleaner |
| **Code-Smoke** | Fast scoped validation (lint, tsc, unit tests on changed files). Responds "SMOKE OK" or "SMOKE FAILED". | Rocket |
| **Code-Cleaner** | Full QA: complete test suites, clean-code refinements, cross-task consistency. | Rocket |
| **Test-Expert** | Runs tests and returns concise summaries. Isolates verbose test output from orchestrator context. | Code-Cleaner |
| **Git-Expert** | Git operations: conventional commits, rebasing, history cleanup. Invoked only on explicit user request. | On-demand |
| **Router-review** | Triage agent. Analyzes diffs and selects relevant audit focuses. | Rocket-Review |
| **Code-Audit** | Specialized auditor. One instance per focus (Security, Perf, Logic, etc.). | Rocket-Review |
| **Critic-review** | Senior auditor. Consolidates audit reports, challenges findings, filters false positives. | Rocket-Review |

---

## Rocket Workflow

Rocket takes a user request, breaks it into micro-tasks, and executes them through a supervised delegation loop with quality gates at every step.

### Phase 1 — Initialization & Analysis

Runs automatically on startup. Rocket scans the project to build context:

- Reads guide files (`.cursor/rules/*.mdc`) for project-specific rules
- Analyzes `package.json` for stack, scripts, and dependencies
- Explores the directory structure and identifies architectural patterns
- Presents a concise summary to the user

### Phase 2 — Design & Planning

Interactive collaboration with the user:

1. **Clarify** — Rocket discusses the requirement, states assumptions, presents alternatives if ambiguous, and pushes back on vague requests.
2. **Propose** — A technical solution with an ordered task breakdown (T1, T2, T3...). Each task is isolated and testable.
3. **Validate** — The user must explicitly approve the plan ("Go" / "Validé"). Rocket will not proceed without approval.

### Phase 3 — Supervised Implementation

Once the plan is validated, Rocket chains tasks autonomously without intermediate user approval:

```
For each task Tn:

  1. Rocket prepares a structured prompt (Context, Files, Specs, Success Criteria)

  2. Implementation & Smoke Check loop (max 3 attempts):
     a. Code-Only implements the task
     b. Rocket verifies physical changes exist (git diff --stat)
     c. Code-Smoke runs scoped validation
     d. SMOKE OK → next task | SMOKE FAILED → retry with error context

  3. If failed after 3 attempts → STOP, ask user for help
```

### Phase 4 — Full QA

Once all tasks pass their smoke checks, `Code-Cleaner` runs a single comprehensive QA pass:
- Full test suites (via `Test-Expert`)
- Clean-code refinements across the entire diff
- Cross-task consistency verification

### Phase 5 — Closure

Rocket delivers a final report and signals that changes are ready to be versioned. The user decides when and how to commit — manually or by requesting `Git-Expert`.

![Rocket Workflow](./assets/rocket-workflow.svg)

### Why This Works

- **No context pollution** — Rocket never sees raw code or full diffs. It stays sharp across 10+ tasks in a single session.
- **Structural guardrails** — `edit`/`write` tools are disabled at the config level. Delegation isn't optional, it's enforced.
- **Quality at every step** — Smoke checks catch regressions immediately. Full QA catches cross-task issues. Two layers of defense.
- **Bounded failure** — 3-attempt max prevents infinite retry loops. Human escalation is built into the workflow.
- **Predictable execution** — The same loop runs for every task. No special cases, no shortcuts.

---

## Rocket-Review Workflow

Rocket-Review is a specialized pipeline for code auditing and pull request reviews. It analyzes changes from multiple expert perspectives concurrently, then consolidates findings into a single actionable report.

### How It Works

1. **Triage** — `Router-review` analyzes the Git diff and selects which audit focuses are relevant (e.g., a CSS change won't trigger a Security audit).
2. **Parallel Audits** — Multiple `Code-Audit` instances run concurrently, each focused on a single aspect.
3. **Consolidation** — `Critic-review` consolidates all audit reports, challenges findings, resolves contradictions, and filters false positives.
4. **Final Report** — A comprehensive review report is delivered to the user.

![Rocket-Review Workflow](./assets/rocket-review-workflow.svg)

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
- **Better signal-to-noise** — `Critic-review` acts as a senior filter, ensuring only actionable feedback reaches the user.

---

## Rocket-Review to Rocket Handoff

The two workflows can be chained. When `Rocket-Review` completes its audit, it produces a **Rocket Implementation Brief** — a structured document containing:

- Prioritized list of issues found
- Suggested fixes with technical context
- Severity classification

This brief can be passed directly to `Rocket` as input for a new implementation session. Rocket will treat it as the initial requirement, skip to Phase 2 (Design & Planning), and propose a task breakdown to address the findings. This creates a closed loop: **Review → Brief → Implementation → Review**.
