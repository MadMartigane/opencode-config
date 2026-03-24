---
name: plan-validate
description: Valide le plan et lance l'implémentation.
---
$1

Plan validé. Procède immédiatement à l'implémentation en respectant ces règles d'exécution :

- **Délégation** : Utilise systématiquement les sous-agents (via l'outil `task`) pour les modifications de code afin de préserver le contexte principal.
- **Parallélisation** : Exécute les tâches indépendantes simultanément. Ne sérialise que les dépendances strictes.
- **Autonomie** : Implémente l'intégralité du plan de bout en bout sans demander de validation intermédiaire.
