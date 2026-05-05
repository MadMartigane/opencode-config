---
name: plan
description: Launch architect in Classic mode after clarification
---

$1

The request is clear enough. Move to planning.

- Gather the `explore` output and the clarified request.
- Call the `architect` subagent in CLASSIC mode.
- Pass both inputs explicitly.
- When the plan returns, present it clearly to the user in French.
- Answer questions and discuss trade-offs while waiting.
- Wait for explicit user approval before execution (prefer `/execute`, but accept direct approvals such as "Go" or "Approved").
- Do not suggest `/plan` or `/plan-thinker` again. If the plan must change, the user must use `/plan-update`.

**Prompt to send to Architect**:
"""
You are operating in CLASSIC mode.

Exploration context:
[INSERT EXPLORATION SUMMARY HERE]

Clarified user request:
[INSERT CLARIFIED REQUEST HERE]

Produce a complete Implementation Plan based on the above.

- Break down into atomic tasks (T1, T2...)
- For each task: specify files, precise specifications, acceptance criteria
- Define execution order and dependencies
- Include validation strategy

Use the "Implementation Plan" template. Be extremely precise.
"""
