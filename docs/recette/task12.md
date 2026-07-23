# Recette — Tâche 12

Version : arbre local du 23/07/2026. Environnement : macOS, PostgreSQL, Redis, API AdonisJS, worker BullMQ, R2/TikTok simulés. SHA et préproduction à compléter.

| ID     | Scénario                  | Résultat attendu                                  | Observé local             | Statut  |
| ------ | ------------------------- | ------------------------------------------------- | ------------------------- | ------- |
| TTK-01 | OAuth et rejeu du state   | compte créé, rejeu refusé                         | API mock                  | OK      |
| TTK-02 | Validation créateur/MP4   | capacités, durée et média contrôlés               | domaine/API               | OK      |
| TTK-03 | Programmation approuvée   | job unique et payload figé                        | API/E2E mock              | OK      |
| TTK-04 | Pending puis succès       | même `publish_id`, publication après confirmation | worker                    | OK      |
| TTK-05 | Échec distant             | statut failed sans retry fonctionnel              | worker                    | OK      |
| TTK-06 | Timeout/429/5xx           | retries 1/5/15 min                                | worker                    | OK      |
| TTK-07 | Version ou payload changé | appel TikTok bloqué                               | worker                    | OK      |
| TTK-08 | Client en écriture        | réponse 403                                       | API                       | OK      |
| TTK-09 | Révocation                | TikTok appelé puis secrets effacés                | API mock                  | OK      |
| TTK-10 | Accessibilité automatisée | aucune violation sérieuse/critique                | Playwright desktop/mobile | OK      |
| TTK-11 | Publication réelle        | une vidéo publiée une fois                        | préproduction             | À faire |
| TTK-12 | Clavier/VoiceOver/zoom    | parcours utilisable                               | préproduction             | À faire |

Captures à joindre : compte/scopes sans token, consentement, validation, statut pending/complete, tentative, vidéo de test, CI et contrôles manuels.
