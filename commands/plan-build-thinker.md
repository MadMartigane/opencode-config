---
name: plan-build-thinker
description: Build plan using architect in Self-Consistency mode (N parallel reasoning paths)
---

Déléguer à l'agent `architect` en mode SELF-CONSISTENCY pour la requête suivante.

Requête : $1

Configuration :
- N = 3 (par défaut, 3 ou 5 appels parallèles)

Instructions for architect:
- Use "SELF-CONSISTENCY" mode
- Use N parallel calls to architect-thinker (default: 3)
- Perform plurality vote on recommendations
- Calculate confidence score
- Produce a consolidated Technical Design Report
