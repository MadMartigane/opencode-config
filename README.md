# OpenCode Workflows

Welcome to the OpenCode workflows documentation! This guide explains the two primary workflows available in our system: **Rocket** and **Rocket-Review**. These workflows are designed to automate and streamline your software engineering tasks using specialized AI agents.

## 🤖 Agents & Subagents

Our workflows are powered by a suite of specialized AI agents, each designed for a specific role:

### Primary Agents (User-Facing)
- **Rocket**: The general-purpose agent for executing multi-step coding tasks and feature implementation.
- **Rocket-Review**: The specialized agent for code auditing and pull request reviews.

### Subagents (Internal Specialists)
- **Code-Only**: The primary coder. Specialized in precise file modifications and creation based on technical specs.
- **Code-Smoke**: The fast validator. Runs lightweight scoped validation (lint, tsc, unit tests) after each Code-Only task.
- **Code-Cleaner**: The QA specialist. Runs full test suites, applies clean-code refinements, and ensures global consistency.
- **Git-Expert**: The Git manager. Handles repository operations, generating conventional commits, and history management.
- **Router-review**: The triage agent for reviews. Analyzes Git diffs and selects relevant audit focuses.
- **Code-Audit**: The specialized auditor. Focuses on specific aspects like Security, Performance, or Style.
- **Critic-review**: The senior auditor. Consolidates multiple audit reports, challenges findings, and filters false positives.
- **Test-Expert**: The testing specialist. Runs tests and provides concise summaries to avoid context pollution.

## 🚀 Rocket Workflow

The **Rocket** workflow is your primary engine for code implementation. It takes a user request, breaks it down into manageable tasks, and executes them systematically while ensuring code quality and stability at every step.

### How it works:

#### 🤝 Phase 1: Initialization & Synchronization
Before writing any code, the `Rocket` agent engages in a crucial synchronization phase with the user. This ensures perfect alignment before the heavy lifting begins:
1. **Understand & Clarify**: The agent analyzes your request. If anything is ambiguous or if critical information is missing, it will proactively ask targeted questions to ensure it fully understands your goals.
2. **Propose Plan**: The agent formulates a high-level development plan and presents it to you. This plan outlines the core features, technologies to be used, and the general approach.
3. **User Approval**: You review the plan, suggest modifications if needed, and give your approval. 
4. **Task Breakdown**: Once the plan is locked in, the agent creates a structured Todo list to track progress systematically.

#### ⚙️ Phase 2: Execution
With the plan approved, the execution phase begins:
1. **Per-Task Loop**: For each task in the Todo list:
   - `Code-Only` implements the necessary code changes.
   - `Code-Smoke` immediately runs lightweight validations (linting, type checking, unit tests) on the modified files.
   - If validation fails, the loop goes back to `Code-Only` to fix the issues.
2. **Refinement & QA**: Once all tasks are successfully implemented and smoke-tested, the `Code-Cleaner` agent takes over to run full test suites, apply clean-code refinements, and ensure global consistency.
3. **Commit**: Finally, the `Git-Expert` agent generates a conventional commit and finalizes the changes.

![Rocket Workflow](./assets/rocket-workflow.svg)

---

## 🔍 Rocket-Review Workflow

The **Rocket-Review** workflow is a specialized pipeline for code auditing and pull request reviews. It leverages multiple specialized agents to analyze code changes from different perspectives concurrently.

### How it works:

1. **Triage**: The primary `Rocket-Review` agent receives a Pull Request or Git diff and passes it to the `Router-review` agent.
2. **Parallel Audits**: `Router-review` analyzes the diff and selects relevant audit focuses. It then spawns multiple `Code-Audit` subagents to perform these audits in parallel.
3. **Consolidation**: The individual audit reports are sent to the `Critic-review` agent, a senior auditor who consolidates the findings, challenges them, and filters out false positives.
4. **Final Report**: A comprehensive, high-quality review report is generated and presented to the user.

![Rocket-Review Workflow](./assets/rocket-review-workflow.svg)

### 🎯 Audit Focus Types

During the triage phase, the `Router-review` agent analyzes the diff and determines which specific aspects of the code need to be reviewed. **These focus types are optional and are not triggered systematically.** Only the relevant audits are launched based on the nature of the changes (e.g., a CSS change won't trigger a Security audit).

The available focus types are:

- 🔒 **Security**: Identifies vulnerabilities, insecure data handling, and potential exploits.
- ⚡ **Performance**: Looks for bottlenecks, inefficient algorithms, and memory leaks.
- 🎨 **Style**: Ensures adherence to coding standards, naming conventions, and formatting rules.
- 🧠 **Logic**: Verifies the correctness of the business logic and algorithmic implementation.
- 🏗️ **Architecture**: Evaluates structural design, design patterns, and system integration.
- ♿ **Accessibility**: Checks for compliance with accessibility standards (e.g., WCAG) in UI changes.
- 🧪 **Testing**: Assesses test coverage, test quality, and edge-case handling.

### ✨ Advantages of Parallel Focused Reviews

This approach offers significant advantages over a traditional, single-pass monolithic review:

1. **Deeper Expertise**: Each subagent acts as a specialist with a single, clear objective, leading to more thorough and accurate findings in its specific domain.
2. **Reduced Cognitive Load**: By not having to look for *everything* at once, the AI avoids context pollution and hallucination, resulting in higher quality feedback.
3. **Speed**: Because the audits run concurrently in parallel, the overall review process is much faster than a sequential review of the same depth.
4. **Cost-Efficiency**: By only triggering the necessary audits (e.g., skipping security checks for a simple typo fix), we optimize resource usage and API costs.
5. **Better Signal-to-Noise Ratio**: The `Critic-review` agent acts as a filter, ensuring that the final report only contains actionable, high-confidence feedback, eliminating the noise often generated by automated tools.