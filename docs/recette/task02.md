# Recette — Tâche 02

Date d’exécution locale : 22/07/2026  
Environnement : macOS, PostgreSQL et Redis Docker, Chromium desktop/mobile  
Testeur : Codex  
Version/SHA : dépôt sans commit, SHA à compléter après livraison

| ID      | Scénario                      | Précondition          | Résultat attendu                          | Observé                     | Statut |
| ------- | ----------------------------- | --------------------- | ----------------------------------------- | --------------------------- | :----: |
| ROLE-01 | Admin liste les comptes       | admin connecté        | liste publique retournée                  | conforme                    |   OK   |
| ROLE-02 | Agence ouvre `/admin/users`   | agence connectée      | 403 API et page accès refusé              | conforme                    |   OK   |
| ROLE-03 | Client ouvre `/admin/users`   | client connecté       | 403 API et page accès refusé              | conforme                    |   OK   |
| ROLE-04 | Admin change un rôle          | compte cible distinct | rôle modifié et audit créé                | conforme                    |   OK   |
| ROLE-05 | Rôle invalide                 | admin connecté        | validation 422                            | conforme                    |   OK   |
| ROLE-06 | Auto-modification             | admin connecté        | refus 403                                 | conforme                    |   OK   |
| ROLE-07 | Désactivation                 | cible active          | état modifié et audit créé                | conforme                    |   OK   |
| ROLE-08 | Session d’un compte désactivé | session antérieure    | 401 et auth retirée de la session         | conforme                    |   OK   |
| ROLE-09 | IDOR inter-clients            | deux clients          | autre profil masqué par 404               | conforme                    |   OK   |
| ROLE-10 | Portée agence                 | deux agences          | profil externe masqué par 404             | conforme                    |   OK   |
| ROLE-11 | Navigation par rôle           | trois comptes         | liens adaptés, sécurité serveur maintenue | conforme desktop/mobile     |   OK   |
| ROLE-12 | Navigation mobile             | largeur mobile        | destinations accessibles au clavier       | défaut détecté puis corrigé |   OK   |

## Exécution

- 37 tests API réussis ;
- 22 tests Vitest frontend réussis ;
- 8 tests Playwright réussis, 4 desktop et 4 mobile ;
- lint, format, typecheck et builds AdonisJS/Nuxt réussis ;
- recette de préproduction, VoiceOver et captures RNCP à réaliser manuellement.
