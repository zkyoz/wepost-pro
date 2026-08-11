# BUG-022 - Le liveness retourne HTTP 500 quand Redis est indisponible

## Identification

| Champ               | Valeur                                                        |
| ------------------- | ------------------------------------------------------------- |
| Issue               | [GitHub #22](https://github.com/zkyoz/wepost-pro/issues/22)   |
| Détection           | 8 août 2026 à 13:44, Europe/Paris                             |
| Consignation GitHub | 12 août 2026, rétrospective et explicitement signalée         |
| Source              | Uptime Kuma pendant un exercice contrôlé de panne Redis       |
| Version affectée    | arbre local `be6fcac`, parent du correctif original `536cf88` |
| Environnement       | local, macOS, API AdonisJS, Redis 7, Uptime Kuma v2           |
| Composants          | API, Redis, supervision                                       |
| Criticité           | S2 majeure                                                    |
| Priorité            | P1                                                            |
| Statut              | `status:validation` - recette encore requise                  |

## Description et reproduction

Le middleware de session accédait à Redis avant le contrôleur de santé. Une
coupure Redis faisait donc retourner HTTP 500 à `/health/live`, alors que le
processus API était toujours démarré.

Préconditions : session Redis active, API et Redis initialement disponibles,
moniteurs Uptime Kuma sur le liveness et la readiness.

1. confirmer que `GET /health/live` répond HTTP 200 ;
2. arrêter Redis avec `docker compose stop redis` ;
3. interroger de nouveau `/health/live` ou attendre les contrôles Uptime Kuma ;
4. consulter les états du liveness et de la readiness.

## Résultat attendu et résultat obtenu

Le liveness devait rester HTTP 200 avec `status: ok`. La readiness devait
signaler séparément l'indisponibilité de Redis.

Résultat obtenu :

- readiness hors ligne à 13:44:11, webhook reçu à 13:44:14 ;
- liveness hors ligne à 13:44:41, webhook reçu à 13:44:44 ;
- message : `Request failed with status code 500` ;
- frontend encore accessible ;
- aucune perte ou altération de données observée.

Le défaut était systématique pendant la coupure Redis dans la configuration
testée. Il rendait le diagnostic trompeur en assimilant une dépendance
indisponible à un processus API arrêté.

## Analyse et préconisation

La session, Shield et l'initialisation de l'authentification étaient dans la
pile globale du routeur. Les routes `/health/*` dépendaient donc du stockage de
session Redis.

La préconisation retenue est de conserver les middlewares sans état dans la
pile globale et d'appliquer session, CSRF et authentification uniquement au
groupe `/api/v1`. Un test doit simuler une exception du stockage de session et
confirmer que `/health/live` reste HTTP 200.

## Correction et validation

La correction est fusionnée par la
[PR #21](https://github.com/zkyoz/wepost-pro/pull/21) au commit
[`46b1032`](https://github.com/zkyoz/wepost-pro/commit/46b10320af945d4ff1854ab25769c71ad0d547d3).
Le test `keeps liveness independent from the session store` remplace
temporairement `SessionMiddleware.handle` par une erreur
`session_store_unavailable`, puis vérifie HTTP 200 et `status: ok`.

- [CI de la PR entièrement verte](https://github.com/zkyoz/wepost-pro/actions/runs/31260827438) ;
- [CI post-fusion sur `develop`](https://github.com/zkyoz/wepost-pro/actions/runs/31261061272) ;
- [preuve technique et captures Uptime Kuma](../evidence/task21.md) ;
- [scénario de recette technique](../recette/task21.md).

Les URLs Push, secrets Redis, cookies, stacks complètes et corps techniques ont
été retirés des preuves publiques. La fermeture de l'issue attend la
reproduction du contrôle sur l'environnement de recette.

## Validation complémentaire du 12 août 2026

Le scénario a été rejoué localement sur l'arbre `06bb3fa`, qui contient le
correctif fusionné `46b1032`. En état nominal, les deux sondes ont répondu
HTTP 200. Après `docker compose stop redis`, `/health/live` a répondu
`{"status":"ok"}` avec HTTP 200 : le symptôme exact de BUG-022 n'est donc plus
reproductible.

La validation a aussi révélé que `/health/ready` dépassait la fenêtre de
10 secondes au lieu de retourner rapidement HTTP 503. Ce comportement distinct
est suivi dans
[`BUG-024`](https://github.com/zkyoz/wepost-pro/issues/24). Redis a été
redémarré sain et la readiness est revenue à HTTP 200.

Le build API compilé a ensuite été lancé localement avec
`NODE_ENV=production` et `GIT_SHA=46b1032`. Les smoke tests nominaux ont réussi :
`/health/live` en 250,79 ms et `/health/ready` en 52,15 ms. Cette répétition ne
remplace pas la recette Coolify. La dernière prérelease publiée,
`v0.1.0-rc.1`, ne contient pas le correctif ; une nouvelle release attend la
validation en recette.
