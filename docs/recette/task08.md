# Recette — Tâche 08

Version testée : arbre local du 22/07/2026. Environnement : macOS, PostgreSQL, Redis, API AdonisJS, worker BullMQ, stockage privé simulé, API Facebook simulée et Nuxt. Testeur automatisé : Codex. SHA et recette de préproduction à compléter après déploiement.

| ID    | Scénario               | Précondition                        | Résultat attendu                                   | Observé local             | Statut  |
| ----- | ---------------------- | ----------------------------------- | -------------------------------------------------- | ------------------------- | ------- |
| FB-01 | OAuth avec `state`     | agence authentifiée                 | Page explicitement choisie connectée               | API et E2E mock           | OK      |
| FB-02 | Rejeu du callback      | `state` déjà consommé               | requête refusée                                    | test API                  | OK      |
| FB-03 | Token protégé          | compte connecté                     | token chiffré et jamais renvoyé                    | test API/unitaire         | OK      |
| FB-04 | Validation nominale    | version approuvée, Page active      | contenu compatible                                 | API et E2E                | OK      |
| FB-05 | Version non approuvée  | version courante différente         | programmation refusée                              | domaine/worker            | OK      |
| FB-06 | Média incompatible     | type non autorisé ou vidéo mélangée | validation refusée                                 | domaine/worker            | OK      |
| FB-07 | Programmation          | agence autorisée                    | job unique et statut `queued`                      | API et E2E                | OK      |
| FB-08 | Double programmation   | même publication/version/compte     | une seule programmation                            | test API                  | OK      |
| FB-09 | Contenu changé         | job déjà programmé                  | worker bloque avant Facebook                       | test worker               | OK      |
| FB-10 | Succès distant         | réponse mock avec identifiant       | identifiant et tentative persistés                 | test worker               | OK      |
| FB-11 | Timeout, 429, 5xx      | erreur transitoire                  | retries 1/5/15 minutes                             | 28 tests worker           | OK      |
| FB-12 | Erreur définitive      | permission/contenu/token            | statut `failed`, sans retry inutile                | test worker               | OK      |
| FB-13 | Relance manuelle       | programmation en échec corrigée     | nouvelle exécution idempotente                     | test API                  | OK      |
| FB-14 | Client                 | projet affecté                      | statut visible, mutations 403                      | test API/E2E              | OK      |
| FB-15 | IDOR                   | autre agence/client                 | ressource masquée en 404                           | test API                  | OK      |
| FB-16 | Révocation             | agence autorisée                    | secrets supprimés et compte révoqué localement     | test API                  | OK      |
| FB-17 | Parcours complet mock  | trois rôles                         | connexion, validation, programmation, consultation | Playwright desktop/mobile | OK      |
| FB-18 | Page Meta réelle       | application Meta validée            | post texte/image/vidéo créé une fois               | à exécuter                | À faire |
| FB-19 | Clavier/VoiceOver/zoom | préproduction                       | parcours utilisable et annonces correctes          | à exécuter                | À faire |
| FB-20 | Alerte 24 h            | monitoring production               | alerte si échecs > 5 %                             | à configurer              | À faire |

Captures à joindre : écran de connexion sans token, scopes/expiration, validation, statut, historique des tentatives, Page Meta de test, run CI et recette clavier/VoiceOver.
