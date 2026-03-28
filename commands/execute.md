---
name: execute
description: Execute all tasks from validated plan + per-task smoke + global validation + retries
---

$1

The user has explicitly typed `/execute`. This validates the current plan and triggers full autonomous execution.

**You must now execute the complete workflow without asking for further confirmation.**

### Execution Protocol:

1. **Task Execution**
   - For each task in the plan (respecting defined order/dependencies):
     - **CRITICAL**: Delegate ALL file modifications to `code-only`. NEVER use `edit` or `write` tools yourself.
     - Pass verbatim specifications from the architect plan to `code-only`
     - Immediately run `code-smoke` in per-task mode after each implementation
     - On failure: retry up to 3 times with enriched context before escalating

2. **Global Validation (MANDATORY)**
   - After all tasks complete: run `code-smoke` in `final` mode (full lint + tests + build)
   - If it fails: trigger `bugfinder` for deep root cause analysis, then `code-only` fix, then revalidate
   - Maximum 3 global retry cycles. If still failing after 3 attempts, stop and give clear report to user.

3. **Closure**
   - Produce a very concise final report in French
   - Include: what was accomplished, number of tasks, validation status, and any remaining issues
   - Clearly state that all changes are local (no commit was made)

**CRITICAL CONSTRAINTS:**
- **ALL file modifications MUST go through `code-only`**. You are physically incapable of editing files (no access to `edit`/`write`). Enforce this strictly.
- Never ask the user for confirmation during the execution phase.
- Be rigorous, systematic and professional.
- Keep the final summary short and factual.
