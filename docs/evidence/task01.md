# Preuves — Tâche 01

## Résumé

Le starter AdonisJS à tokens a été remplacé par une authentification web officielle par session. Nuxt gère l’inscription, la connexion, la restauration de session, une page privée et la déconnexion, sans stocker de token côté navigateur.

## Versions réellement relevées

| Composant           | Version                   |
| ------------------- | ------------------------- |
| Node cible          | 24.x (`.nvmrc`)           |
| pnpm                | 11.11.0                   |
| Nuxt                | 4.5.0                     |
| Vue                 | 3.5.40                    |
| AdonisJS core       | 7.3.5 résolu              |
| TypeScript          | 6.0.3                     |
| PostgreSQL          | 17 (`postgres:17-alpine`) |
| Redis               | 7 (`redis:7-alpine`)      |
| `@adonisjs/auth`    | 10.1.0 déclaré            |
| `@adonisjs/session` | 8.1.0 déclaré             |

## User stories et code

- créer un compte et être connecté immédiatement ;
- ouvrir et restaurer une session ;
- consulter le profil public courant ;
- fermer la session courante ;
- refuser une route privée sans session ;
- protéger les mutations contre CSRF et limiter les tentatives.

Les preuves principales sont `config/auth.ts`, `config/session.ts`, le modèle `User`, les contrôleurs sous `app/controllers/auth`, `start/routes.ts`, `useAuth.ts` et les pages sous `apps/web/app/pages`.

## Migration

`1761885935168_create_users_table.ts` crée `users` avec UUID, `agency_id` nullable, e-mail unique, hash de mot de passe, nom affiché, rôle provisoire, état actif et timestamps UTC. La migration est réversible. Aucune table `auth_access_tokens`, `user_sessions`, `refresh_tokens` ou `jwt_tokens` n’existe.

## Commandes et résultats locaux

| Commande                                             | Résultat du 22/07/2026                  |
| ---------------------------------------------------- | --------------------------------------- |
| `pnpm install --frozen-lockfile`                     | OK, lockfile à jour                     |
| `node ace migration:fresh --force`                   | OK                                      |
| `pnpm test:coverage`                                 | 34 tests unitaires/API/frontend réussis |
| `pnpm lint` / `pnpm format:check` / `pnpm typecheck` | OK                                      |
| `pnpm build`                                         | API et Nuxt construits avec succès      |
| `pnpm audit --audit-level high`                      | aucune vulnérabilité connue             |
| Playwright desktop                                   | 3/3 réussis                             |
| Playwright mobile                                    | 3/3 réussis                             |
| axe critique/sérieux                                 | 0 violation sur la page de connexion    |

Couverture mesurée :

| Périmètre             |  Lignes | Branches | Fonctions |
| --------------------- | ------: | -------: | --------: |
| API AdonisJS          | 97,60 % |  95,50 % |   91,93 % |
| Frontend ciblé        |   100 % |  85,00 % |     100 % |
| Contrôleur de session | 95,23 % |  85,71 % |     100 % |

Les seuils CI sont actifs à 80 % de lignes et 70 % de branches. Les rapports LCOV et JSON sont générés sous `apps/*/coverage` puis ignorés par Git.

## Preuves visuelles

Les concepts conservés dans `docs/evidence/task01/concepts/` couvrent connexion desktop, inscription desktop, tableau de bord et connexion mobile. Les rendus locaux vérifiés sont archivés dans `docs/evidence/task01/screenshots/` : connexion desktop et mobile, inscription desktop et espace privé. La largeur mobile mesurée est de 390 px sans débordement horizontal. Une nouvelle capture du cookie devra être réalisée en recette HTTPS en masquant impérativement sa valeur.

## CI, sécurité et limites

`.github/workflows/ci.yml` définit lint, format, typecheck, couverture, builds, audit, E2E, Gitleaks et CodeQL. Le fichier est présent mais aucun run GitHub ne peut être cité avant le premier commit et le premier push. Il faut encore joindre une capture de CI rouge puis verte, un SHA, la recette HTTPS, les tests RGAA manuels et les attributs du cookie de recette.
