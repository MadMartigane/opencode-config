---
name: plan-thinker
description: Launch architect in Self-Consistency mode
---

$1

Le brief est suffisamment clair, passe à la phase de planification :

- Récupére le résultat de l'exploration (`explore`) et le brief clarifié de la demande.
- Appeler le subagent `architect` en mode SELF-CONSISTENCY .
- Lui transmettre explicitement ces deux éléments.
- Une fois le plan reçu, le présenter clairement à l'utilisateur en français. Répondre aux questions et challenges de l'utilisateur. Attendre une validation explicite de l'utilisateur (par exemple via `/execute`, "Go", "Validé", etc.). Ne pas suggérer `/plan` ou `/plan-thinker` à nouveau ; pour modifier le plan, l'utilisateur doit utiliser `/plan-update`.

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
