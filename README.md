# OpenCode Workflows

Welcome to the OpenCode workflows documentation! This guide explains the two primary workflows available in our system: **Rocket** and **Rocket-Review**. These workflows are designed to automate and streamline your software engineering tasks using specialized AI agents.

## 🚀 Rocket Workflow

The **Rocket** workflow is your primary engine for code implementation. It takes a user request, breaks it down into manageable tasks, and executes them systematically while ensuring code quality and stability at every step.

### How it works:

1. **Task Breakdown**: The primary `Rocket` agent analyzes your request and creates a structured Todo list.
2. **Per-Task Loop**: For each task in the list:
   - `Code-Only` implements the necessary code changes.
   - `Code-Smoke` immediately runs lightweight validations (linting, type checking, unit tests) on the modified files.
   - If validation fails, the loop goes back to `Code-Only` to fix the issues.
3. **Refinement & QA**: Once all tasks are successfully implemented and smoke-tested, the `Code-Cleaner` agent takes over to run full test suites, apply clean-code refinements, and ensure global consistency.
4. **Commit**: Finally, the `Git-Expert` agent generates a conventional commit and finalizes the changes.

![Rocket Workflow](./assets/rocket-workflow.svg)

---

## 🔍 Rocket-Review Workflow

The **Rocket-Review** workflow is a specialized pipeline for code auditing and pull request reviews. It leverages multiple specialized agents to analyze code changes from different perspectives concurrently.

### How it works:

1. **Triage**: The primary `Rocket-Review` agent receives a Pull Request or Git diff and passes it to the `Router-review` agent.
2. **Parallel Audits**: `Router-review` analyzes the diff and selects relevant audit focuses (e.g., Security, Performance, Style, Logic). It then spawns multiple `Code-Audit` subagents to perform these audits in parallel.
3. **Consolidation**: The individual audit reports are sent to the `Critic-review` agent, a senior auditor who consolidates the findings, challenges them, and filters out false positives.
4. **Final Report**: A comprehensive, high-quality review report is generated and presented to the user.

![Rocket-Review Workflow](./assets/rocket-review-workflow.svg)
