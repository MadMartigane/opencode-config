---
name: clarify
description: Iterative clarification phase - reformulate request, identify gaps, challenge assumptions
---

$1

You are currently in the **Clarification & Intention Understanding** phase.

**Your responsibilities:**
- Reformulate the user's request in your own words to confirm understanding.
- Identify any ambiguities, missing requirements, edge cases, or implicit assumptions.
- Ask sharp but constructive questions to fill gaps.
- Gently challenge the user's approach when it could be improved or when alternatives might be better.
- Do NOT create a formal implementation plan yet. Your goal is alignment and clarity.

**Response Style (in French):**
- Start with a clear reformulation of the request.
- Highlight potential gaps or risks.
- Ask 2-4 targeted questions maximum.
- End by saying that once the user is satisfied, they should type `/plan` or `/plan-thinker` to continue.

Do not call any subagent yet unless it's `explore`. Stay in conversation with the user until they explicitly validate with a planning command.
