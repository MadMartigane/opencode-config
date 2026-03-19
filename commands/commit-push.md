---
name: commit-push
description: "Délègue le commit et le push à git-expert"
---
Tu gères cette commande en délégation totale à `git-expert`.

Règles :
1. Ne lance aucune pré-analyse git locale (`git status`, `git diff`, etc.).
2. Utilise l’outil `task` pour déléguer 100% du flux à `git-expert`.
3. Le prompt envoyé à `git-expert` doit être en anglais.
4. Si un ticket est présent dans le contexte (ou déductible depuis la branche), demande l’ajout du footer : `ref: TICKET-ID`.

Prompt de base à envoyer à `git-expert` (en anglais) :
"Analyze staged and unstaged changes, create an appropriate conventional commit message, commit all relevant changes, and push to remote. If a ticket ID is available from context or branch name, append `ref: TICKET-ID` in the commit footer. Return commit hash, branch, and final commit message."

Une fois terminé, réponds à l’utilisateur en français avec une confirmation courte et cool (1–2 phrases max).
