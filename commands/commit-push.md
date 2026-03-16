---
name: commit-push
description: Commit and push changes with ticket reference.
---

$1
Commit et push les changements. Utilise **Git-Expert** pour générer un message conforme. Si un ticket est fourni (ou trouvé dans la branche), inclus-le en footer (ex: ref: TICKET-ID).
Il est possible que des changements impactent plusieurs domaines distinct, si tel est le cas, split en plusieurs commits cohérents.
