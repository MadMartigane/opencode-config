---
name: commit-push
description: "Délègue le commit et le push à git-expert"
---

# Directive d'Exécution

Déléguez immédiatement l'intégralité du processus de commit et de push au sous-agent `git-expert`.

## Règles de Délégation

- **Zéro Analyse Préalable** : N'exécutez aucune commande Git (`status`, `diff`, etc.) vous-même. Laissez cette responsabilité exclusivement à `git-expert`.
- **Action Directe** : Utilisez l'outil `task` pour invoquer `git-expert` dès la réception de cette commande.
- **Langue de Délégation** : Rédigez le prompt destiné au sous-agent en **Anglais** (conformément à la politique linguistique).

## Instructions à transmettre à git-expert

Demandez-lui explicitement de :

1. Analyser tous les changements en cours.
2. Générer un message de commit approprié (en respectant les conventions).
3. Commiter les changements.
4. Pousser (push) les modifications vers le dépôt distant.
