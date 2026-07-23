# Recette — Tâche 07

Version testée : arbre local du 22/07/2026. Environnement : macOS, PostgreSQL, Redis, API AdonisJS, worker BullMQ simulé et Nuxt. Testeur automatisé : Codex. SHA et recette de préproduction à compléter après déploiement.

| ID     | Scénario                 | Précondition                     | Résultat attendu                                  | Observé local             | Statut  |
| ------ | ------------------------ | -------------------------------- | ------------------------------------------------- | ------------------------- | ------- |
| COL-01 | Commentaire client       | client affecté                   | commentaire daté, auteur conservé                 | API et E2E                | OK      |
| COL-02 | Commentaire agence       | agence autorisée                 | client notifié                                    | test API                  | OK      |
| COL-03 | Fil chronologique        | plusieurs commentaires           | ordre croissant stable                            | test API                  | OK      |
| COL-04 | Modification auteur      | moins de 15 minutes              | contenu modifié et date d’édition                 | test API                  | OK      |
| COL-05 | Modification étrangère   | autre utilisateur                | 403                                               | test API                  | OK      |
| COL-06 | Modération admin         | commentaire existant             | suppression logique et audit                      | logique/API               | OK      |
| COL-07 | Demande de corrections   | version en revue                 | statut `changes_requested`                        | API et E2E                | OK      |
| COL-08 | Approbation              | version courante en revue        | statut `approved`, version mémorisée              | API et E2E                | OK      |
| COL-09 | Version périmée          | contenu modifié                  | 409 avec version courante                         | test API                  | OK      |
| COL-10 | Décision agence          | agence connectée                 | 403                                               | test API                  | OK      |
| COL-11 | IDOR inter-client/agence | ressource étrangère              | 404                                               | test API                  | OK      |
| COL-12 | Notification lue/non lue | notification personnelle         | état et compteur mis à jour                       | test API                  | OK      |
| COL-13 | Échec de mise en file    | Redis indisponible simulé        | activité métier conservée, état `failed`          | test unitaire             | OK      |
| COL-14 | Worker                   | succès, retry, erreur définitive | états persistés, retry contrôlé                   | 8 tests Vitest            | OK      |
| COL-15 | HTML malveillant         | commentaire `<img onerror>`      | texte affiché sans exécution                      | API et composant          | OK      |
| COL-16 | Parcours complet         | trois comptes                    | soumission, correction, modification, approbation | Playwright desktop/mobile | OK      |
| COL-17 | Clavier/VoiceOver/zoom   | préproduction                    | parcours utilisable et annonces correctes         | à exécuter                | À faire |
| COL-18 | Resend réel              | domaine et clé configurés        | e-mail HTML/texte reçu une seule fois             | à exécuter                | À faire |

Captures à joindre : fil, demande de corrections, approbation, notifications, état d’échec e-mail et run worker.
