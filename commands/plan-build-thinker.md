---
name: plan-build-thinker
description: Build plan using architect in Self-Consistency mode (N parallel reasoning paths)
---
$1

Prépare un plan découpé en tâches autonomes pour atteindre cet objectif.
Délègue à l'agent `architect` en mode SELF-CONSISTENCY en lui donnant les objectifs à atteindre et non la façon (le quoi et pas le comment).

Configuration :
- N = 3 (par défaut, 3 ou 5 appels parallèles)

Instructions pour `architect`:
- Use "SELF-CONSISTENCY" mode
- Use {N} parallel calls to architect-thinker (default: 3)
- Perform plurality vote on recommendations
- Calculate confidence score
- Produce a consolidated Technical Design Report
