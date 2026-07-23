# Recette — Tâche 10

Version testée : arbre local du 22/07/2026. Environnement : macOS, PostgreSQL, Redis, API AdonisJS, worker BullMQ, R2 et API LinkedIn simulés, Nuxt. Testeur automatisé : Codex. SHA et recette préproduction à compléter après déploiement.

| ID    | Scénario                    | Précondition                    | Résultat attendu                        | Observé local              | Statut  |
| ----- | --------------------------- | ------------------------------- | --------------------------------------- | -------------------------- | ------- |
| LI-01 | OAuth avec `state`          | agence authentifiée             | organisation explicitement sélectionnée | API et E2E mock            | OK      |
| LI-02 | Rejeu du callback           | `state` consommé                | requête refusée                         | test API                   | OK      |
| LI-03 | Droits organisation         | rôle administrateur/contenu     | organisation autorisée                  | client OAuth mock/unitaire | OK      |
| LI-04 | Token protégé               | organisation connectée          | tokens chiffrés et jamais renvoyés      | test API/unitaire          | OK      |
| LI-05 | Renouvellement              | refresh token fourni            | nouvel accès chiffré et audit           | test API mock              | OK      |
| LI-06 | Validation texte            | version approuvée               | texte ≤ 3 000 caractères accepté        | domaine/worker             | OK      |
| LI-07 | Validation image            | un JPEG/PNG propre              | contenu compatible                      | API/worker/E2E             | OK      |
| LI-08 | Format ou nombre invalide   | vidéo ou plusieurs médias       | validation refusée                      | domaine/worker             | OK      |
| LI-09 | Programmation               | agence autorisée                | job unique, statut `queued`             | API/E2E                    | OK      |
| LI-10 | Double programmation        | même publication/version/compte | une seule programmation                 | test API                   | OK      |
| LI-11 | Contenu changé              | job programmé                   | blocage avant LinkedIn                  | test worker                | OK      |
| LI-12 | Upload et création du post  | image R2 privée                 | initialisation, transfert puis `/posts` | test worker mock           | OK      |
| LI-13 | Timeout, 429, 5xx           | erreur transitoire              | retries 1/5/15 minutes                  | test worker                | OK      |
| LI-14 | Erreur définitive           | contenu, permission ou token    | échec sans retry inutile                | test worker                | OK      |
| LI-15 | Idempotence                 | deux exécutions                 | un seul identifiant distant simulé      | test worker                | OK      |
| LI-16 | Relance                     | échec corrigé                   | nouvelle exécution auditée              | test API                   | OK      |
| LI-17 | Client                      | projet affecté                  | statut visible, mutation 403            | test API/E2E               | OK      |
| LI-18 | Révocation                  | agence autorisée                | secrets effacés                         | test API                   | OK      |
| LI-19 | Accessibilité auto          | écran LinkedIn connecté         | aucune violation axe sérieuse/critique  | Playwright desktop/mobile  | OK      |
| LI-20 | Publication LinkedIn réelle | App Review et organisation test | texte/image publiés une fois            | à exécuter                 | À faire |
| LI-21 | Clavier/VoiceOver/zoom      | préproduction                   | parcours utilisable                     | à exécuter                 | À faire |
| LI-22 | Alerte 24 h                 | monitoring production           | alerte si échecs > 5 %                  | à configurer               | À faire |

Captures à joindre : connexion sans token, organisation/scopes, validation, statut, tentatives, publication de test, run CI et recette clavier/VoiceOver.
