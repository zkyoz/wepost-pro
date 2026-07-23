# Preuves — Tâche 02

## Résumé

La tâche ajoute trois rôles, une matrice de permissions centralisée, un middleware d’autorisation, des règles de portée anti-IDOR, une administration minimale des comptes et un journal d’audit transactionnel. Nuxt adapte la navigation et fournit une page d’accès refusé, tandis que l’API reste la source d’autorité.

## Fichiers structurants

- domaine : `user_role.ts`, `permissions.ts`, `resource_scope.ts` ;
- API : `permission_middleware.ts`, `users_controller.ts`, `admin/users_controller.ts` ;
- données : migration `1784745000000_add_roles_and_audit_logs.ts`, modèle `AuditLog` ;
- interface : `AppNavigation.vue`, `PrivateShell.vue`, `admin/users.vue`, `access-denied.vue`, middleware `role.ts` ;
- tests : suites d’autorisation Japa/Vitest et parcours Playwright à trois comptes.

## Migration

La migration ajoute la contrainte `users_role_check` avec `admin | agency | client` et crée `audit_logs` avec UUID, acteur, cible, action, valeurs JSONB précédente/suivante et date UTC indexée. Les clés étrangères utilisent `ON DELETE SET NULL`. Le rollback supprime la table et la contrainte.

## Routes

Les routes `/api/v1/admin/users*` exigent successivement le guard session `web` et `users.manage`. `/api/v1/users/:id` applique le guard puis la portée utilisateur, avec 404 hors périmètre.

## Résultats locaux du 22/07/2026

| Contrôle                               | Résultat                    |
| -------------------------------------- | --------------------------- |
| API Japa                               | 37/37                       |
| Frontend Vitest                        | 22/22                       |
| Playwright                             | 8/8, desktop et mobile      |
| API lignes / branches / fonctions      | 95,18 % / 94,85 % / 89,28 % |
| Frontend lignes / branches / fonctions | 100 % / 89,65 % / 94,44 %   |
| domaine `app/domain/auth`              | 100 % lignes et branches    |
| lint / format / typecheck              | OK                          |
| builds AdonisJS / Nuxt                 | OK                          |

Les rapports LCOV/JSON sont générés localement dans les dossiers `coverage` ignorés par Git.

## Sécurité et RGAA

Les tests négatifs couvrent les rôles, l’enum, l’auto-modification, la désactivation, les portées client/agence et l’absence de régression CSRF/CORS. La navigation mobile a échoué au premier passage E2E parce qu’elle était masquée ; le style a été corrigé et les 8 scénarios finaux passent.

Les contrôles RGAA manuels, la recette de préproduction, les captures, le SHA et les exécutions CI rouge/verte restent à joindre après publication du dépôt.
