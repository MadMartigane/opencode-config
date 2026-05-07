---
name: execute
description: Execute the validated plan through delegated implementation and validation
---

$1

Execute the validated plan now. Do not ask for more confirmation.

1. For each task, in order:
   - Delegate implementation to `code-only` with the exact task specifications.
   - Run `code-smoke` in per-task mode immediately after each implementation.
   - If a task fails, retry up to 3 times with better context. Then stop and report clearly.

2. After all tasks:
   - Run `code-smoke` in `final` mode.
   - If global validation fails, use `bugfinder`, then `code-only`, then `code-smoke` again.
   - Maximum 3 global fix/validation cycles. Then stop and report clearly.

3. At the end:
   - Reply in the user's language.
   - State what was completed, validation status, remaining issues, and that no commit was made.

Rules:
- Never modify files yourself. Use `code-only` for all file changes.
- Never validate code yourself. Use `code-smoke` for all checks.

Do not modify any other file. Return a concise summary of what changed.