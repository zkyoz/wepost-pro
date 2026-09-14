# Preuves de correction C4.2.2 - BUG-022

## Chaîne de traçabilité

- anomalie : [BUG-022](https://github.com/zkyoz/wepost-pro/issues/22) ;
- branche : [`codex/fix-health-liveness`](https://github.com/zkyoz/wepost-pro/tree/codex/fix-health-liveness) ;
- commit de branche : [`00494b6`](https://github.com/zkyoz/wepost-pro/commit/00494b6c6701df1b7d927ed074ecb07c6b03a116) ;
- Pull Request : [#21](https://github.com/zkyoz/wepost-pro/pull/21) ;
- CI de la PR : [workflow 31260827438](https://github.com/zkyoz/wepost-pro/actions/runs/31260827438) ;
- fusion dans `develop` : [`46b1032`](https://github.com/zkyoz/wepost-pro/commit/46b10320af945d4ff1854ab25769c71ad0d547d3) ;
- CI post-fusion : [workflow 31261061272](https://github.com/zkyoz/wepost-pro/actions/runs/31261061272).

Le workflow de la PR a réussi les jobs qualité/tests/builds, Gitleaks, CodeQL
et Playwright/axe. Le job principal comprend `pnpm test:coverage` et
`pnpm build`.

## Non-régression

Le test `keeps liveness independent from the session store` simule une
exception du middleware de session et exige HTTP 200 sur `/health/live`.

Le 12 août 2026, les cinq tests fonctionnels de supervision ont été rejoués
localement avec la configuration non sensible de la CI : 5/5 réussis en
959 ms.

Pendant un arrêt réel du conteneur Redis, le liveness a répondu HTTP 200 avec
`status: ok`. Avant le correctif, le même type d'exercice produisait HTTP 500.
Le défaut décrit par BUG-022 est donc corrigé dans l'environnement local.

## Répétition de déploiement

L'API compilée par `pnpm --filter @wepost/api build` a été lancée localement en
mode `production` avec `GIT_SHA=46b1032`. Les smoke tests ont obtenu :

| Route           | État    |     Durée |
| --------------- | ------- | --------: |
| `/health/live`  | `ok`    | 250,79 ms |
| `/health/ready` | `ready` |  52,15 ms |

Cette preuve valide l'artefact en local. Elle ne couvre pas Coolify, Traefik,
HTTPS ni les secrets de recette.

Le workflow CI comprend également un job `Deployment rehearsal`, exécuté après
les jobs qualité, E2E, Gitleaks et CodeQL. Il reconstruit l'API sur un runner
éphémère, lance le serveur compilé en mode production, attend le liveness puis
exécute les smoke tests. Les journaux sont conservés comme artefact pendant
14 jours. Ce job est une porte de déploiement automatisée ; il ne remplace pas
la recette Coolify.

## Version et limites

La dernière prérelease `v0.1.0-rc.1`, attachée à `3164aa7`, précède le
correctif. La version corrigée est identifiée par `46b1032` dans `develop` ; la
release suivante ne doit être publiée qu'après recette.

La validation a détecté une anomalie séparée : la readiness dépasse 10 secondes
lorsque Redis est arrêté. Elle est suivie dans
[`BUG-024`](https://github.com/zkyoz/wepost-pro/issues/24). Elle ne réintroduit
pas le défaut de liveness, mais doit être corrigée avant la supervision de
production.
