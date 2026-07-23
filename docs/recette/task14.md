# Recette — Tâche 14

Version : arbre local du 23/07/2026. Environnement : macOS, PostgreSQL, Redis, AdonisJS et Nuxt. SHA et préproduction à compléter.

| ID     | Scénario                     | Résultat attendu                                         | Observé local        | Statut  |
| ------ | ---------------------------- | -------------------------------------------------------- | -------------------- | ------- |
| SUP-01 | Synthèse                     | données réelles par catégorie                            | Japa                 | OK      |
| SUP-02 | Cohérence compteur/liste     | totaux identiques                                        | Japa                 | OK      |
| SUP-03 | Filtres                      | client, projet, réseau, période et responsable appliqués | Japa/Vitest          | OK      |
| SUP-04 | Commentaire non lu           | apparaît après commentaire client                        | Playwright Chromium  | OK      |
| SUP-05 | Marquer lu                   | disparaît du compteur, historique conservé               | Japa/Playwright      | OK      |
| SUP-06 | Isolation agence             | aucune donnée inter-agence                               | Japa                 | OK      |
| SUP-07 | Accès client                 | API et page refusées                                     | Japa/middleware Nuxt | OK      |
| SUP-08 | Volumétrie                   | synthèse sous 500 ms sur 20 × 40 publications            | Japa : 5,88 ms       | OK      |
| SUP-09 | RGAA automatisable           | aucune violation axe sérieuse/critique                   | Playwright/axe       | OK      |
| SUP-10 | Clavier/lecteur d’écran/zoom | parcours utilisable                                      | préproduction        | À faire |
