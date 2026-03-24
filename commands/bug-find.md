---
name: bug-find
description: Find bug, build plan, wait validation.
---

**Contexte du Bug :**
$1

**Procédure d'Exécution :**

1. **Délégation :** Invoque immédiatement le sous-agent `bugfinder` via l'outil `task`.
2. **Instruction (en Anglais) :** Transmets le contexte du bug au sous-agent. Exige qu'il identifie la cause racine et produise un plan de correction détaillé, étape par étape.
3. **Restitution (en Français) :** Présente clairement l'analyse et le plan d'action du sous-agent à l'utilisateur.
4. **Point d'Arrêt :** Demande explicitement la validation de l'utilisateur. Ne modifie aucun fichier et n'écris aucun code tant que l'accord n'est pas donné.
