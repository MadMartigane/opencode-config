---
name: plan
description: Launch architect in Classic mode after clarification
---

$1

Le brief est suffisamment clair, passe à la phase de planification :

- Récupére le résultat de l'exploration (`explore`) et le brief clarifié de la demande.
- Appeler le subagent `architect` en mode CLASSIC.
- Lui transmettre explicitement ces deux éléments.
- Une fois le plan reçu, le présenter clairement à l'utilisateur en français et attendre une validation explicite.

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
