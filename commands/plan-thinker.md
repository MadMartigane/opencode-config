---
name: plan-thinker
description: Launch architect in Self-Consistency mode
---

$1

**Context**: L'utilisateur a validé la clarification avec `/plan-thinker`.

**Rocket's Task**:
- Récupérer le résultat de l'exploration (`explore`) et le brief clarifié de la demande.
- Appeler le subagent `architect` en mode SELF-CONSISTENCY (N=3).
- Lui transmettre explicitement ces deux éléments.
- Présenter le plan consolidé à l'utilisateur et attendre validation explicite.

**Prompt to send to Architect**:
"""
You are operating in SELF-CONSISTENCY mode with N=3.

Exploration context:
[INSERT EXPLORATION SUMMARY HERE]

Clarified user request:
[INSERT CLARIFIED REQUEST HERE]

Run 3 parallel reasoning paths, then consolidate into a Technical Design Report containing:
- A clear Implementation Plan with atomic tasks
- Confidence Score and analysis
- Points of consensus and divergence

Use the "Technical Design Report" template with Self-Consistency Analysis section.
"""
