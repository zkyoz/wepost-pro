# Recette — Tâche 09

Version testée : arbre local du 22/07/2026. Environnement : macOS, PostgreSQL, Redis, API AdonisJS, worker BullMQ, R2 et API Instagram simulés, Nuxt. Testeur automatisé : Codex. SHA et recette préproduction à compléter après déploiement.

| ID    | Scénario                  | Précondition                      | Résultat attendu                          | Observé local             | Statut  |
| ----- | ------------------------- | --------------------------------- | ----------------------------------------- | ------------------------- | ------- |
| IG-01 | OAuth avec `state`        | agence authentifiée               | compte professionnel explicitement choisi | API et E2E mock           | OK      |
| IG-02 | Rejeu du callback         | `state` consommé                  | requête refusée                           | test API                  | OK      |
| IG-03 | Token protégé             | compte connecté                   | token chiffré et jamais renvoyé           | test API/unitaire         | OK      |
| IG-04 | Validation image          | version approuvée, un JPEG propre | contenu compatible                        | API/E2E                   | OK      |
| IG-05 | Validation vidéo          | version approuvée, un MP4 propre  | Reel compatible                           | domaine/worker            | OK      |
| IG-06 | Format ou nombre invalide | zéro, plusieurs, PNG/GIF          | validation refusée                        | domaine/worker            | OK      |
| IG-07 | Programmation             | agence autorisée                  | job unique, statut `queued`               | API/E2E                   | OK      |
| IG-08 | Double programmation      | même publication/version/compte   | une seule programmation                   | test API                  | OK      |
| IG-09 | Contenu changé            | job programmé                     | blocage avant Meta                        | test worker               | OK      |
| IG-10 | Cycle conteneur           | API mockée                        | création, attente, `media_publish`        | test worker               | OK      |
| IG-11 | Timeout, 429, 5xx         | erreur transitoire                | retries 1/5/15 minutes                    | test worker               | OK      |
| IG-12 | Erreur définitive         | contenu, permission ou token      | échec sans retry inutile                  | test worker               | OK      |
| IG-13 | Idempotence               | deux exécutions                   | un seul identifiant distant simulé        | test worker               | OK      |
| IG-14 | Relance                   | échec corrigé                     | nouvelle exécution auditée                | test API                  | OK      |
| IG-15 | Client                    | projet affecté                    | statut visible, mutation 403              | test API/E2E              | OK      |
| IG-16 | Révocation                | agence autorisée                  | secrets effacés                           | test API                  | OK      |
| IG-17 | Accessibilité auto        | écran Instagram connecté          | aucune violation axe sérieuse/critique    | Playwright desktop/mobile | OK      |
| IG-18 | Publication Meta réelle   | App Review et compte test         | image et vidéo publiées une fois          | à exécuter                | À faire |
| IG-19 | Clavier/VoiceOver/zoom    | préproduction                     | parcours utilisable                       | à exécuter                | À faire |
| IG-20 | Alerte 24 h               | monitoring production             | alerte si échecs > 5 %                    | à configurer              | À faire |

Captures à joindre : connexion sans token, compte/scopes, validation, statut, tentatives, compte Meta de test, run CI et recette clavier/VoiceOver.
