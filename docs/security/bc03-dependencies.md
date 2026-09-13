# Audit des dépendances — préparation BC03

Sur la branche `codex/bc03-demo`, l’audit de préparation signalait quatre
alertes élevées. Les overrides existants ont été complétés de manière ciblée :
`browserslist` 4.28.7, `js-yaml` 4.3.2 et `svgo` 4.1.0. Le lockfile a été
régénéré avec pnpm, sans changement des versions déclarées des frameworks.

Résultat de `pnpm audit --audit-level high` après installation : code de sortie
0, zéro alerte élevée ou critique, quatre alertes modérées restantes.
Avant les modifications fonctionnelles LinkedIn, les tests avaient passé :
197 API, 106 frontend et 100 worker. Ne pas présenter cet audit comme une
absence universelle de vulnérabilités.

La mise à jour reste isolée sur la branche de démonstration. Aucun changement
de `main`, de `develop`, de version de production ni de déploiement externe
n’est inclus.
