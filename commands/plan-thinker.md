---
name: plan-thinker
description: Launch architect in Self-Consistency mode
---

$1

The request is clear enough. Move to planning.

- Gather the `explore` output and the clarified request.
- Call the `architect` subagent in SELF-CONSISTENCY mode.
- Pass both inputs explicitly.
- When the plan returns, present it clearly to the user in French.
- Answer questions and discuss trade-offs while waiting.
- Wait for explicit user approval before execution (prefer `/execute`, but accept direct approvals such as "Go" or "Approved").
- Do not suggest `/plan` or `/plan-thinker` again. If the plan must change, the user must use `/plan-update`.

**Prompt to send to Architect**:
"""
You are operating in SELF-CONSISTENCY mode with N=3.

Exploration context:
[INSERT EXPLORATION SUMMARY HERE]

Clarified user request:
[INSERT CLARIFIED REQUEST HERE]

Your task:

1. Use the `task` tool to spawn 3 parallel calls to the `architect-thinker` subagent. Pass the exact same problem/context to each worker.
2. Wait for all 3 reports to complete.
3. Consolidate the results into a single Technical Design Report containing:
   - A clear Implementation Plan with atomic tasks
   - Confidence Score and analysis based on consensus between the 3 reasoning paths
   - Points of consensus and divergence

Use the "Technical Design Report" template with Self-Consistency Analysis section.
"""
