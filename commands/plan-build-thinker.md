---
name: plan-build-thinker
description: Build plan using architect in Self-Consistency mode (N parallel reasoning paths)
---
$1

Délègue l'analyse et la planification de cet objectif à l'agent `architect`.

### Règles de délégation

- **Agent cible** : `architect`
- **Langue** : Anglais (obligatoire pour communiquer avec les sous-agents)
- **Périmètre** : Décris uniquement le résultat attendu (le "quoi"), laisse l'agent définir la solution technique (le "comment").

### Directives obligatoires pour le prompt

Ton prompt destiné à l'agent `architect` DOIT inclure ces instructions exactes :

1. `Execute in SELF-CONSISTENCY mode (N=3).`
2. `Produce a consolidated Technical Design Report.`
3. `Include an Implementation Plan broken down into autonomous tasks with clear execution order and dependencies.`
