# Recette — Tâche 11

Version testée : arbre local du 22/07/2026. Environnement : macOS, PostgreSQL, Redis, API AdonisJS, worker BullMQ, R2 et API Pinterest simulés, Nuxt. Testeur automatisé : Codex. SHA et recette préproduction à compléter après déploiement.

| ID     | Scénario               | Précondition                           | Résultat attendu                       | Observé local      | Statut  |
| ------ | ---------------------- | -------------------------------------- | -------------------------------------- | ------------------ | ------- |
| PIN-01 | OAuth avec `state`     | agence authentifiée                    | compte et tableaux chargés             | API/E2E mock       | OK      |
| PIN-02 | Rejeu du callback      | `state` consommé                       | requête refusée                        | test API           | OK      |
| PIN-03 | Sélection admin        | admin authentifié                      | agence existante obligatoire           | test API           | OK      |
| PIN-04 | Token protégé          | compte connecté                        | tokens chiffrés, jamais renvoyés       | API/unitaire       | OK      |
| PIN-05 | Renouvellement         | refresh token disponible               | nouvel accès chiffré et audit          | API mock           | OK      |
| PIN-06 | Tableau et contenu     | tableau, titre, description, lien      | validation cohérente                   | domaine/worker/E2E | OK      |
| PIN-07 | Image                  | un JPEG/PNG propre                     | média compatible                       | API/worker/E2E     | OK      |
| PIN-08 | Entrée invalide        | tableau, lien, type ou nombre invalide | validation refusée                     | API/worker         | OK      |
| PIN-09 | Programmation          | version approuvée                      | job unique `queued`                    | API/E2E            | OK      |
| PIN-10 | Double exécution       | même clé interne                       | un Pin distant simulé                  | API/worker         | OK      |
| PIN-11 | Version/payload changé | job programmé                          | blocage avant Pinterest                | worker             | OK      |
| PIN-12 | Erreurs transitoires   | timeout, 429 ou 5xx                    | retries 1/5/15 min                     | worker             | OK      |
| PIN-13 | Erreur définitive      | contenu, permission ou token           | aucun retry inutile                    | worker             | OK      |
| PIN-14 | Relance                | échec corrigé                          | nouvelle exécution auditée             | API                | OK      |
| PIN-15 | Client                 | projet affecté                         | statut visible, mutation 403           | API/E2E            | OK      |
| PIN-16 | Révocation             | agence autorisée                       | secrets effacés                        | API                | OK      |
| PIN-17 | Accessibilité auto     | écran connecté                         | aucune violation axe sérieuse/critique | desktop/mobile     | OK      |
| PIN-18 | Publication réelle     | app et tableau de test                 | Pin image publié une fois              | à exécuter         | À faire |
| PIN-19 | Clavier/VoiceOver/zoom | préproduction                          | parcours utilisable                    | à exécuter         | À faire |
| PIN-20 | Alerte 24 h            | monitoring production                  | alerte si échecs > 5 %                 | à configurer       | À faire |

Captures à joindre : compte/scopes/tableaux sans token, validation, statut, tentatives, Pin de test, run CI et recette clavier/VoiceOver.
