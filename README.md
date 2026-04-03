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
| **rocket** | Tech Lead & orchestrator. Designs, plans, delegates, supervises. Never codes directly — **all file modifications go through `code-only`**. |
| **rocket-review** | Audit orchestrator. Analyzes diffs via parallel specialized audits and produces actionable reports. |

### Subagents (Internal Specialists)

| Agent | Role | Used by |
|---|---|---|
| **explore** | Fast codebase discovery and mapping (structure, files, patterns, conventions). Read-only. | rocket |
| **architect** | Mandatory design authority for features/enhancements/structural changes. Read-only analysis. | rocket |
| **bugfinder** | Relentless Deep Code Intelligence & Root Cause investigation. Used for any complex logic understanding or unexpected behavior. Read-only. | rocket |
| **code-only** | Implements code changes from structured specs. Responds "DONE" or "ERROR". | rocket |
| **code-smoke** | Unified validation agent: per-task (syntax+lint) and final (syntax+lint+tests+build). Reports diagnostics, never fixes. | rocket |
| **worktree-manager** | Creates/cleans isolated Git worktrees for opt-in parallel execution with file overlap. | rocket |
| **git-expert** | Git operations: merge, commit, push, rebase, history cleanup. Invoked only on explicit user request. | rocket (on-demand), worktree flow |
| **router-review** | Triage agent. Analyzes diffs and selects relevant audit focuses. | rocket-review |
| **code-audit** | Specialized auditor. One instance per focus (Security, Perf, Logic, etc.). | rocket-review |
| **critic-review** | Senior auditor. Consolidates audit reports, challenges findings, filters false positives. | rocket-review |

---

## rocket Workflow

### What Rocket is

**Rocket is a command-driven Tech Lead orchestrator.** The system is built on a clear separation between persona and workflow:

- **The prompt defines how Rocket behaves** — the agent persona, tone, and guardrails are encoded in the system prompt.
- **The commands define what workflow step happens next** — `/clarify`, `/plan`, `/execute` are explicit triggers that move the process forward.
- **This separation keeps the workflow flexible without changing the persona** — you can add new commands or modify the flow without touching the core identity.

### Base workflow (main path)

The default workflow follows a strict chain with mandatory gates:

1. **Request** — User describes the task in natural language.
2. **Exploration** — Rocket automatically calls `explore` to map the codebase. This step is mandatory before any clarification.
3. **`/clarify`** — Iterative phase where Rocket reformulates the request, identifies gaps, and challenges assumptions constructively.
4. **`/plan`** — User triggers planning. Rocket calls `architect` in classic mode to produce an implementation plan with atomic tasks.
5. **User validation** — User reviews and explicitly validates the plan before execution proceeds.
6. **`/execute`** — Rocket launches the full implementation workflow: delegates all coding to `code-only`, validates each task with `code-smoke`, and runs a final global validation.
7. **Closure** — Rocket provides a concise summary of completed work.

```
Request → Exploration → /clarify → /plan → [User validates] → /execute → Closure
```

![rocket Workflow](./assets/rocket-workflow.svg)

### Why this workflow is easy to understand

| Aspect | Count | Details |
|--------|-------|---------|
| **Explicit user control points** | 3 | Ask in natural language → Type `/plan` → Type `/execute` |
| **Mandatory quality gates** | 2 | Architect plan before execution → Final validation after execution |
| **Bounded retry policy** | 1 | Max 3 retries on validation failure, then human escalation |

### `/plan-thinker` as an alternative

At planning time, users can choose `/plan-thinker` instead of `/plan` for ambiguous, high-risk, or architecture-heavy tasks. This alternative path:

- Spawns multiple parallel reasoning paths (currently documented as 3 parallel reasoning paths in this repository)
- Synthesizes results with confidence scoring based on consensus
- Provides better robustness on complex reasoning tasks

### Why use /plan-thinker for harder tasks?

Classic `/plan` follows a single reasoning path: one analysis, one plan. `/plan-thinker` uses self-consistency decoding: multiple independent reasoning paths explore the problem in parallel, then a synthesis step identifies the consensus solution with a confidence score. Research shows this approach significantly improves accuracy on hard reasoning tasks. The self-consistency paper (Wang et al., 2022) reports gains of +17.9% on GSM8K math reasoning and +8.4% on MultiArith when using multiple paths versus greedy decoding [1]. On complex arithmetic reasoning, consistency between paths improves accuracy by up to 23.6% compared to single-path baselines [2]. The trade-off is straightforward: more compute (3× parallel calls) buys better robustness when the problem has multiple valid approaches or high ambiguity. For routine tasks, classic `/plan` is faster and sufficient. For architecture decisions, complex refactoring, or ambiguous requirements, `/plan-thinker` reduces the risk of missing critical alternatives.

*[1] Wang et al., "Self-Consistency Improves Chain of Thought Reasoning in Language Models", https://arxiv.org/abs/2203.11171*
*[2] Ibid., Table 2, MultiArith results*

### Commands table

| Command | Description |
|---------|-------------|
| `/clarify` | Clarify and challenge the request |
| `/plan` | Default planning path |
| `/plan-thinker` | Alternative planning path for complex cases |
| `/execute` | Run the validated plan |

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


