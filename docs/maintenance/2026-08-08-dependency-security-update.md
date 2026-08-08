# Mise à jour de sécurité des dépendances — 8 août 2026

## Identification

- compétence : RNCP 39583, C4.1.1 ;
- branche : `codex/fix-nuxt-security-update` ;
- base : `origin/develop` au commit `d90fc91` ;
- périmètres analysés : frontend, API, worker et outillage du monorepo ;
- environnement de validation : macOS, Node 24.19.0, pnpm 11.11.0,
  PostgreSQL 17 et Redis 7.

## Détection et qualification

Le 8 août 2026, `pnpm audit --audit-level high` signalait 22
vulnérabilités : 1 critique, 12 élevées et 9 modérées. La vulnérabilité
critique concernait `@nuxt/devtools` antérieur à 3.3.1. Plusieurs avis élevés
concernaient Nuxt 4.5.0, notamment l'exécution de code côté serveur, la fuite
de données SSR entre utilisateurs et l'épuisement de ressources.

La proposition Dependabot groupée n'a pas été intégrée telle quelle, car elle
associait ce correctif à TypeScript 7 et BullMQ 6. Ces montées majeures restent
hors de ce changement afin de limiter le risque et de permettre un rollback
indépendant.

| Composant         | Version ou plage vulnérable     | Version retenue | Périmètre               | Criticité observée |
| ----------------- | ------------------------------- | --------------- | ----------------------- | ------------------ |
| Nuxt              | 4.5.0                           | 4.5.2           | frontend et serveur SSR | critique à élevée  |
| `@nuxt/devtools`  | 3.2.4                           | 3.4.1 via Nuxt  | développement frontend  | critique           |
| `undici`          | version antérieure à 8.9.0      | 8.10.0 via Nuxt | client HTTP transitif   | élevée             |
| `brace-expansion` | branches 2.x et 5.x vulnérables | 2.1.4 et 5.0.9  | web, API et outillage   | élevée             |
| `js-yaml`         | antérieure à 4.3.1              | 4.3.1           | outillage frontend      | élevée             |
| `nanoid`          | antérieure à 3.3.17             | 3.3.17          | outillage frontend      | élevée             |
| `dompurify`       | antérieure à 3.4.13             | 3.4.13          | PostHog frontend        | modérée            |
| PostCSS           | antérieure à 8.5.23             | 8.5.23          | construction frontend   | modérée            |
| `tar`             | antérieure à 7.5.21             | 7.5.21          | construction Nitro      | modérée            |

Nuxt est déclaré dans `apps/web/package.json`. Les correctifs transitifs sont
centralisés dans les `overrides` de `pnpm-workspace.yaml` et leurs résolutions
exactes sont enregistrées dans `pnpm-lock.yaml`.

## Analyse d'impact

Le changement ne modifie aucune route, règle métier, migration, table, donnée,
variable d'environnement ou API sociale. Les risques retenus étaient une
incompatibilité Node, TypeScript, Vite, PostCSS ou SSR, ainsi qu'une régression
des parcours web.

Nuxt 4.5.2 exige une version récente de Node 24. Les validations ont donc été
réalisées avec Node 24.19.0, conformément à `.nvmrc`. Un essai sous Node 26.7.0
a provoqué une erreur Adonis Ace avant l'exécution des tests API ; ce résultat
n'a pas été compté comme une régression applicative, puisque Node 26 n'est pas
la version de référence du projet. La plage du manifeste racine est donc
resserrée à `>=24.11.0 <25.0.0`.

`pnpm peers check` conserve un avertissement sur Argon2 0.45.0, dont la plage
n'est pas encore déclarée compatible par AdonisJS 7.3.5 et `@adonisjs/hash`
10.1.0. Le même avertissement est présent sur la base `develop` avant ce
changement. Il constitue une dette préexistante à surveiller, pas un résultat
introduit par cette mise à jour.

## Sauvegarde et réversibilité

Aucune sauvegarde PostgreSQL n'a été créée : le changement porte uniquement
sur le frontend et le graphe de dépendances, sans migration ni transformation
de données. Git et le lockfile assurent la réversibilité du code.

En cas de régression, le commit de mise à jour doit être reverté, puis
`pnpm install --frozen-lockfile` et les builds doivent être rejoués avant un
redéploiement. Aucune restauration de base de données n'est nécessaire.

## Résultats mesurés

| Contrôle                                       | Résultat                                                     |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `pnpm install --frozen-lockfile`               | réussi avec pnpm 11.11.0                                     |
| Formatage, lint et TypeScript                  | réussis sur web, API et worker                               |
| Documentation OpenAPI                          | synchronisée, 146 routes                                     |
| Tests API                                      | suite réussie ; lignes 86,19 %, branches 71,91 %             |
| Tests web                                      | 100/100 ; lignes 84,03 %, branches 76,25 %                   |
| Tests worker                                   | 97/97 ; lignes 92,23 %, branches 81,52 %                     |
| Builds                                         | Nuxt, AdonisJS et worker réussis                             |
| E2E Playwright                                 | 18/18 sur Chromium desktop et mobile                         |
| Accessibilité automatisée incluse dans les E2E | aucune régression bloquante détectée sur les parcours testés |
| `pnpm audit` final                             | aucune vulnérabilité connue, code de sortie 0                |

Les tests ont utilisé exclusivement la base `wepost_test`, Redis avec des
préfixes et bases dédiés, ainsi que les pilotes simulés des services externes.
Aucun appel réel aux réseaux sociaux ni aucune donnée de production n'a été
utilisé.

## Décision

Le correctif est validé localement. Son intégration reste soumise à la Pull
Request vers `develop`, à la CI GitHub et à la revue humaine prévues par le
processus de maintenance.
