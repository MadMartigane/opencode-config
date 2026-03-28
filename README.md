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

rocket is a command-driven Tech Lead that guides the user through a structured process using explicit commands. It never writes code itself and maintains strong user gates.

### Recommended Workflow

1. **Request** — User makes a request in natural language.
2. **Exploration** — rocket automatically calls `explore` to understand the codebase.
3. **Clarification** — rocket iteratively reformulates the request, identifies gaps, and challenges assumptions (`/clarify`).
4. **Planning** — User types `/plan` (classic) or `/plan-thinker` (self-consistency) to trigger `architect`.
5. **Validation** — User reviews the plan and validates it.
6. **Execution** — User types `/execute` to launch the full implementation pipeline.
7. **Closure** — rocket provides a concise summary.

This command-based approach (`/clarify` → `/plan` → `/execute`) ensures strong understanding before any code is modified.

### Execution Details

Once `/execute` is called:
- rocket orchestrates `code-only` + `code-smoke` (per-task) for each task in the plan
- A final global validation is always performed (`code-smoke` in final mode)
- On failure, up to 3 retry cycles are attempted using `bugfinder` for deep analysis
- All changes remain local. Git operations are only performed when explicitly requested via `git-expert`.

![rocket Workflow](./assets/rocket-workflow.svg)

### Why This Works

- **Clear user gates** — `/plan` and `/execute` create explicit validation points
- **Strong clarification first** — the `/clarify` phase ensures high-quality requirements
- **Delegation by construction** — `architect` handles planning, `code-only` handles implementation, `code-smoke` handles validation
- **Quality gates** — per-task and global smoke tests with bounded retries (max 3)
- **Command-driven** — explicit commands make the process predictable and controllable

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

---

## Rocket Commands

| Commande | Description |
|----------|-------------|
| `/clarify` | Phase itérative de reformulation, détection des ambiguïtés et challenge constructif de la demande. |
| `/plan` | Génère un plan d’implémentation via `architect` en mode Classique (recommandé par défaut). |
| `/plan-thinker` | Génère un plan via `architect` en mode Self-Consistency (3 chemins parallèles + synthèse). |
| `/execute` | Valide le plan et déclenche l’exécution complète du workflow (tâches + smoke per-task + validation globale + retries si besoin). |

**Workflow recommandé :**

1. Faire une demande
2. Laisser Rocket faire l’exploration automatique
3. Itérer en clarification (`/clarify`) si nécessaire
4. Taper `/plan` (ou `/plan-thinker` pour les cas complexes)
5. Valider le plan proposé par l’architecte
6. Taper `/execute` pour lancer l’implémentation complète et autonome

Ce workflow assure une bonne compréhension initiale avant toute exécution.
