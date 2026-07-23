# Recette — Tâche 06

Version testée : arbre local du 22/07/2026. Environnement : macOS, PostgreSQL, Redis, API AdonisJS et Nuxt. Testeur automatisé : Codex. SHA et recette de préproduction à compléter après déploiement.

| ID     | Scénario                         | Précondition              | Résultat attendu                                     | Observé local       | Statut  |
| ------ | -------------------------------- | ------------------------- | ---------------------------------------------------- | ------------------- | ------- |
| CAL-01 | Vue mensuelle                    | publications datées       | événements placés au jour local                      | test API et E2E     | OK      |
| CAL-02 | Vue semaine                      | calendrier chargé         | sept jours, navigation de période                    | tests unitaires     | OK      |
| CAL-03 | Vue liste                        | calendrier chargé         | alternative chronologique complète                   | E2E desktop/mobile  | OK      |
| CAL-04 | Filtres                          | plusieurs projets/statuts | résultat limité sans fuite                           | tests API et E2E    | OK      |
| CAL-05 | Sans date                        | publication non planifiée | section dédiée visible                               | test API            | OK      |
| CAL-06 | Déplacement agence               | publication éditable      | UTC mis à jour, version incrémentée, statut conservé | API et E2E          | OK      |
| CAL-07 | Approbation conservée            | publication approuvée     | `approved_version` conservée                         | test API            | OK      |
| CAL-08 | Concurrence                      | version périmée           | 409 et calendrier actualisé                          | test API            | OK      |
| CAL-09 | Déplacement client               | client affecté            | 403, aucun contrôle UI                               | API et E2E          | OK      |
| CAL-10 | IDOR                             | autre agence              | 404                                                  | test API            | OK      |
| CAL-11 | Heure d’été inexistante          | 29/03/2026 02:30 Paris    | validation refusée                                   | tests unitaires/API | OK      |
| CAL-12 | Plage excessive                  | plus de 366 jours         | 422                                                  | test API            | OK      |
| CAL-13 | Clavier, zoom et lecteur d’écran | préproduction             | parcours utilisable et annoncé                       | à exécuter          | À faire |

Captures à joindre : trois vues, filtres, publication sans date, formulaire de déplacement et conflit 409.
