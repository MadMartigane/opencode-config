---
name: parallel-worktree
description: Orchestre l'exécution parallèle de tâches indépendantes via des worktrees Git isolés
---

# Workflow : Parallel Worktree

Ce workflow définit la procédure stricte pour isoler, exécuter, valider et fusionner des tâches en parallèle.

## 🎯 Prérequis et Règles

- **Indépendance** : Les tâches à exécuter ne doivent avoir aucune dépendance entre elles.
- **Branche de base (`{base}`)** : Utilisez la première branche existante parmi : `release/next` > `develop` > `main` > `master`.
- **Nomenclature** : Chaque tâche utilise un identifiant unique (`{task-id}`).
  - Dossier cible : `.trees/{task-id}/`
  - Branche cible : `task/{task-id}`

## 🧰 Skills Requis

Chargez les skills suivants avant de démarrer :

- `git-worktree`
- `git-branch-cleaner`
- `git-commit-messages`

## 🔄 Séquence d'Exécution

### 1. Provisionnement

Déléguez à l'agent **`git-expert`** la création des environnements pour chaque tâche :

```bash
git worktree add -b task/{task-id} .trees/{task-id}/ {base}
```

### 2. Implémentation (Parallèle)

Lancez simultanément un agent **`code-only`** pour chaque tâche.

- **Contrainte** : Chaque agent doit travailler **exclusivement** dans son répertoire `.trees/{task-id}/`.

### 3. Validation et Correction

Déléguez à l'agent **`code-smoke`** (mode `per-task`) la validation de chaque worktree.

- **Boucle de correction (Max 3 tentatives par tâche)** :
  1. En cas d'échec, analysez l'erreur et relancez `code-only` dans le worktree pour corriger.
  2. Revalidez avec `code-smoke`.
  3. Si l'échec persiste après 3 tentatives, marquez la tâche comme "Échouée - Revue manuelle requise". **Ne fusionnez jamais une tâche en échec.**

### 4. Fusion

Pour toutes les tâches validées avec succès, déléguez à l'agent **`git-expert`** l'intégration dans la branche de base :

```bash
git checkout {base}
git merge --no-ff task/{task-id}
```

### 5. Nettoyage

Déléguez à l'agent **`git-expert`** la suppression des environnements temporaires :

```bash
git worktree remove .trees/{task-id}/
git branch -D task/{task-id}
git worktree prune
```
