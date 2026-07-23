# Cahier de recette — Tâche 01

- Version : arbre de travail initial, aucun SHA disponible avant le premier commit
- Date automatisée : 22 juillet 2026
- Environnement : macOS, PostgreSQL 17 Docker, Redis 7 Docker, Chromium Playwright
- Testeur automatisé : Codex

| ID      | Scénario                    | Précondition    | Résultat attendu           | Résultat observé                                       | Statut  |
| ------- | --------------------------- | --------------- | -------------------------- | ------------------------------------------------------ | ------- |
| AUTH-01 | Inscription valide          | aucun compte    | compte et session créés    | API + E2E desktop/mobile réussis                       | OK      |
| AUTH-02 | E-mail déjà utilisé         | compte existant | erreur compréhensible      | `422`, e-mail normalisé                                | OK      |
| AUTH-03 | Validation formulaire       | aucune          | erreurs liées aux champs   | VineJS + tests frontend réussis                        | OK auto |
| AUTH-04 | Connexion valide            | compte actif    | session ouverte            | session `auth_web` constatée                           | OK      |
| AUTH-05 | Connexion invalide          | compte actif    | message générique          | même réponse que compte absent                         | OK      |
| AUTH-06 | Compte désactivé            | compte inactif  | connexion refusée          | `401` générique                                        | OK      |
| AUTH-07 | Consultation profil         | connecté        | profil public              | mot de passe absent                                    | OK      |
| AUTH-08 | Route privée sans session   | déconnecté      | accès refusé               | `401` et redirection Nuxt                              | OK      |
| AUTH-09 | Persistance au rechargement | connecté        | session conservée          | E2E desktop/mobile réussi                              | OK      |
| AUTH-10 | Déconnexion                 | connecté        | session détruite           | clé auth absente et `/me` à `401`                      | OK      |
| AUTH-11 | Réutilisation après logout  | déconnecté      | accès refusé               | redirection avec motif session expirée                 | OK      |
| AUTH-12 | Navigation clavier          | aucune          | parcours réalisable        | focus automatisé vérifié ; lecture manuelle requise    | PARTIEL |
| AUTH-13 | Zoom et reflow              | aucune          | aucune perte               | profil mobile automatisé OK ; zoom 200 % manuel requis | PARTIEL |
| AUTH-14 | CSRF                        | session/cookie  | requête illégitime bloquée | POST sans token à `403`                                | OK      |
| AUTH-15 | Rate limit                  | échecs répétés  | limitation appliquée       | 11e tentative à `429`                                  | OK      |

Les colonnes testeur humain, anomalie liée et validation de recette seront complétées après déploiement. Aucune anomalie bloquante automatisée ne subsiste ; la recette HTTPS et les contrôles RGAA manuels sont en attente.
