# Recette — Tâche 05

Version testée : arbre local du 22/07/2026. Environnement : macOS, PostgreSQL et stockage local simulant R2. Testeur automatisé : Codex. La recette de préproduction et son SHA restent à renseigner après déploiement.

| ID     | Scénario                | Précondition                            | Étapes principales                     | Résultat attendu                                 | Observé local               | Statut  |
| ------ | ----------------------- | --------------------------------------- | -------------------------------------- | ------------------------------------------------ | --------------------------- | ------- |
| MED-01 | Upload signé            | Agence connectée, publication autorisée | choisir PNG, saisir alt, envoyer       | upload initialisé, transféré, validé et associé  | API et E2E desktop/mobile   | OK      |
| MED-02 | Type MIME falsifié      | upload initialisé                       | envoyer un PNG déclaré JPEG, finaliser | fichier rejeté et objet supprimé                 | 422, `mime_mismatch`        | OK      |
| MED-03 | Taille excessive        | agence connectée                        | annoncer un fichier > limite           | transfert refusé                                 | 413                         | OK      |
| MED-04 | Alternative absente     | image informative                       | envoyer sans alt et sans décoratif     | validation refusée                               | 422                         | OK      |
| MED-05 | Image décorative        | média valide                            | cocher décoratif et enregistrer        | alt nul accepté                                  | testé en intégration        | OK      |
| MED-06 | Réordonnancement        | deux médias associés                    | utiliser Monter/Descendre              | ordre stable et persistant                       | API et E2E desktop/mobile   | OK      |
| MED-07 | Lecture client          | client affecté                          | ouvrir la publication                  | URL privée signée et aperçu visible              | API et E2E desktop/mobile   | OK      |
| MED-08 | IDOR                    | utilisateur autre agence                | demander URL média                     | ressource non divulguée                          | 404                         | OK      |
| MED-09 | Écriture client         | client affecté                          | modifier une alternative               | mutation interdite                               | 403                         | OK      |
| MED-10 | Suppression/purge       | média associé                           | supprimer puis purger                  | soft delete, dissociation, objet et ligne purgés | E2E suppression, API purge  | OK      |
| MED-11 | Upload abandonné        | upload expiré non finalisé              | exécuter le nettoyage                  | objet et ligne supprimés                         | testé en intégration        | OK      |
| MED-12 | Navigation clavier/RGAA | interface chargée                       | parcourir upload, alt et ordre         | parcours complet, focus visible, annonces        | à vérifier en préproduction | À faire |

Captures à joindre : upload en cours, liste ordonnée, aperçu client, erreur par fichier et recette à 320 px.
