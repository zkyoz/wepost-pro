# Recette — Tâche 13

Version : arbre local du 23/07/2026. Environnement : macOS, PostgreSQL, Redis, AdonisJS et Nuxt. SHA et préproduction à compléter.

| ID     | Scénario                     | Résultat attendu                              | Observé local             | Statut  |
| ------ | ---------------------------- | --------------------------------------------- | ------------------------- | ------- |
| ADM-01 | Tableau de bord              | compteurs réels et liens globaux              | API/Nuxt                  | OK      |
| ADM-02 | Recherche et pagination      | filtrage serveur borné                        | Japa/Vitest               | OK      |
| ADM-03 | Détail global                | fiche sans token ni secret                    | Japa                      | OK      |
| ADM-04 | Désactivation/réactivation   | confirmation, effet et audit                  | Japa/Playwright           | OK      |
| ADM-05 | Changement de rôle           | endpoint dédié et audit                       | Japa                      | OK      |
| ADM-06 | Dernier administrateur       | perte d’accès bloquée                         | unitaire/API              | OK      |
| ADM-07 | Archivage/restauration       | projet/publication restaurés sans suppression | Japa                      | OK      |
| ADM-08 | Accès agence/client          | toutes les routes renvoient 403               | Japa                      | OK      |
| ADM-09 | Audit immuable               | contenu UPDATE/DELETE refusé                  | PostgreSQL/Japa           | OK      |
| ADM-10 | RGAA automatisable           | aucune violation axe sérieuse/critique        | Playwright desktop/mobile | OK      |
| ADM-11 | Clavier/lecteur d’écran/zoom | parcours utilisable                           | préproduction             | À faire |

Capture locale présente : `docs/evidence/task13/screenshots/admin-dashboard-desktop.png`. Restent à joindre en préproduction : filtres, confirmation, compte désactivé puis actif, incident expurgé, audit, CI et contrôles manuels.
