---
name: anomaly-orchestrator
description: Intelligent classification and routing of technical anomalies.
version: 1.0.0
---

# Skill: Anomaly Orchestrator

## 1. Mission & Overview
The **Anomaly Orchestrator** is responsible for the intelligent classification and routing of technical anomalies (errors, bugs, regressions). Its primary goal is to determine whether a problem can be resolved mechanically by an implementation agent or if it requires higher-level cognitive analysis, architectural decisions, or complex troubleshooting by the **BugFinder**.

## 2. Decision Matrix: Simple vs Complex

Use the following criteria to classify the anomaly and determine the routing path:

| Category | Characteristics | Routing |
| :--- | :--- | :--- |
| **SIMPLE Problems** | - Lint/formatting errors (auto-fixable)<br>- Missing obvious imports<br>- Typos or incorrect naming conventions<br>- Trivial TypeScript type fixes (e.g., adding `any` as temporary fix or obvious union types)<br>- Broken test with an obvious, single-point cause<br>- Simple syntax errors | **Direct Resolution** (Code-Only) |
| **COMPLEX Problems** | - Architectural issues (wrong patterns or violation of project structure)<br>- Refactoring requiring design decisions or impacting multiple modules<br>- Non-trivial logical bugs with no immediate obvious cause<br>- Changes impacting multiple interdependent files<br>- Performance regressions requiring profiling/analysis<br>- API inconsistencies requiring a decision on the source of truth<br>- Unclear root cause or intermittent failures | **BugFinder Escalation** |

## 3. BugFinder Escalation Procedure

When a problem is classified as **COMPLEX**, invoke the **BugFinder** subagent:

### Context Requirements
Provide the BugFinder with:
- Complete error messages and stack traces.
- Paths to all relevant files.
- Step-by-step reproduction instructions (if applicable).
- Original requirements or expected behavior.

### Processing the Report
Once the BugFinder provides a report:
1. Extract the **Root Cause** to understand the "Why".
2. Extract the **Technical Solution** to define the "How".
3. Use the structured solution to guide the next implementation task.

## 4. Direct Resolution Procedure

When a problem is classified as **SIMPLE**, proceed directly to implementation:

### Criteria Verification
Confirm the problem fits into the "Simple" category and has a low risk of side effects.

### Implementation Setup
Prepare a structured prompt for the **Code-Only** agent including:
- **Context**: Project rules and the specific error context.
- **Files**: The specific file(s) needing modification.
- **Specs**: Precise, surgical instructions to fix the error.
- **Success Criteria**: Clear validation commands (lint, test, build).

## 5. Correction Loop

If an implementation attempt fails, follow this protocol:
1. **Limit**: Maximum of 3 total attempts per specific anomaly.
2. **Analysis**: Read the failure logs (test output, lint errors) carefully.
3. **Retry**: Prepare a new prompt for the implementation agent.
4. **Correction Section**: Explicitly include a `## CORRECTION REQUIRED` section at the top of the prompt.
5. **Details**: Include the exact error from the previous attempt and what specifically needs to change to avoid repeating the mistake.
6. **Escalation**: If 3 attempts fail, escalate the anomaly to **COMPLEX** and invoke the **BugFinder**.

## 6. Success Criteria

An anomaly is considered resolved only when "VALIDATION SUCCESS" is achieved:
- **Zero Errors**: No TypeScript, lint, or syntax errors remaining in the modified scope.
- **Tests Pass**: All relevant unit and integration tests pass.
- **Logic Verified**: The fix correctly addresses the requirement without breaking existing functionality.
- **Clean Code**: The solution adheres to project standards and doesn't introduce technical debt.
