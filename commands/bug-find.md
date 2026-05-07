---
name: bug-find
description: Find bug, build plan, wait validation.
---

## Bug Context

$1

## Execution

1. Immediately call the `bugfinder` subagent via `task`.
2. Send the bug context in English. Require root cause analysis and a step-by-step fix plan.
3. Present the analysis and action plan to the user in the user language.
4. Stop there. Ask for explicit user approval before any code change.
