---
name: parallel-worktree
description: Active le mode worktree pour exécution parallèle de tâches
---

Active le mode worktree pour l'exécution parallèle de tâches. Ce mode provisionne des worktrees Git isolés pour chaque tâche, exécute les agents en parallèle, valide les résultats, puis fusionne le tout.

## Structure de travail

- **Worktrees**: `.trees/{task-id}/`
- **Branches**: `task/{task-id}`
- **Branche de base**: `release/next` > `develop` > `main/master`

## Workflow complet

### 1. Provisionner les Worktrees

Déléguer à `worktree-manager` pour chaque tâche :

```
git worktree add -b task/{task-id} .trees/{task-id}/ {base}
```

### 2. Lancer l'exécution parallèle

Pour chaque tâche, lancer simultanément un agent `code-only` dans son worktree dédié. Chaque agent travaille dans l'isolation de son propre worktree.

### 3. Valider chaque tâche

Après exécution, lancer `code-smoke` en mode `per-task` dans chaque worktree pour valider le code produit.

### 4. Parser les résultats

Extraire les diagnostics de chaque worktree. Collecter les succès et échecs.

### 5. Gérer les échecs (max 3 retries par tâche)

Si une tâche échoue :
- Analyser l'erreur
- Ré-exécuter dans le worktree correspondant
- Maximum 3 tentatives
- Si échec définitif, marquer pour revue manuelle

### 6. Fusionner les branches

Quand toutes les tâches sont validées, déléquer à `git-expert` pour fusionner toutes les branches `task/{task-id}` dans la branche de base.

### 7. Cleanup

Après fusion réussie :
```
git worktree remove .trees/{task-id}/
git branch -D task/{task-id}
git worktree prune
```

## Agents et rôles

| Agent | Rôle |
|-------|------|
| `worktree-manager` | Provisionner et nettoyer les worktrees |
| `code-only` | Exécuter les tâches dans les worktrees isolés |
| `code-smoke` | Valider le code dans chaque worktree |
| `git-expert` | Fusionner les branches après exécution |

## Skills requis

- **git-worktree**: Pour les opérations worktree
- **git-branch-cleaner**: Pour le nettoyage des branches
- **git-commit-messages**: Pour les messages de commit

## Commandes Git utilisées

```bash
# Créer worktree
git worktree add -b task/{task-id} .trees/{task-id}/ {base}

# Supprimer worktree
git worktree remove .trees/{task-id}/

# Nettoyer worktrees orphelins
git worktree prune

# Supprimer branche
git branch -D task/{task-id}

# Fusion (via git-expert)
git checkout {base}
git merge --no-ff task/{task-id}
```

## Prérequis

- Les tâches doivent être sans dépendances entre elles
- Chaque tâche doit avoir un identifiant unique
- La branche de base doit exister et être accessible

## Gestion des erreurs

- Chaque tâche: maximum 3 retries
- Si retry épuisé: suspendre et notifier
- Conserver les logs de chaque tentative
- Ne jamais fusionner une branche avec des tests en échec
