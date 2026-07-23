# Recette — Tâche 21

Version : arbre local du 23/07/2026. SHA et préproduction à compléter.

| ID     | Scénario               | Résultat attendu                              | Observé local | Statut  |
| ------ | ---------------------- | --------------------------------------------- | ------------- | ------- |
| SYS-01 | Liveness               | HTTP 200 sans dépendance externe              | Japa          | OK      |
| SYS-02 | Readiness              | DB, Redis et file agrégés ; 503 si nécessaire | Japa          | OK      |
| SYS-03 | Corrélation            | identifiant sûr renvoyé et journalisé         | Japa          | OK      |
| SYS-04 | Accès admin            | détails et métriques visibles                 | Japa/E2E      | OK      |
| SYS-05 | Accès agence/client    | détails refusés                               | Japa          | OK      |
| SYS-06 | Worker expiré          | down après cinq minutes sans heartbeat        | Japa          | OK      |
| SYS-07 | Heartbeat push         | Redis et Uptime Kuma alimentés                | Vitest mock   | OK      |
| SYS-08 | Relance                | seulement un job failed, action auditée       | Japa/mémoire  | Partiel |
| SYS-09 | Page accessible        | tableau textuel et axe sans erreur bloquante  | Playwright    | OK      |
| SYS-10 | Alerte réelle          | notification reçue après dépendance simulée   | préproduction | À faire |
| SYS-11 | Smoke post-déploiement | live et ready verts                           | script local  | OK      |

Le smoke local du 23/07/2026 a obtenu `ok` sur `/health/live` et `ready` sur
`/health/ready`. SYS-08 reste partiel tant qu'une relance sur une file Redis
persistante n'a pas été exécutée en préproduction.
