# Correctifs `Unreleased`

## Mise à jour de sécurité des dépendances

- PR [#20](https://github.com/zkyoz/wepost-pro/pull/20) ;
- merge commit `80a6c2a` ;
- Nuxt 4.5.0 vers 4.5.2 et dépendances transitives corrigées ;
- audit final sans vulnérabilité connue ;
- tests, E2E et builds verts ;
- aucune release ou recette persistante à cette date.

Détail :
[`docs/maintenance/2026-08-08-dependency-security-update.md`](../../maintenance/2026-08-08-dependency-security-update.md).

## BUG-022 - Liveness et session Redis

- issue [#22](https://github.com/zkyoz/wepost-pro/issues/22) ;
- commit correctif `00494b6` ;
- PR [#21](https://github.com/zkyoz/wepost-pro/pull/21) ;
- merge commit `46b1032` ;
- liveness HTTP 200 confirmé pendant un arrêt Redis ;
- test de non-régression et CI verte ;
- aucune release ou recette persistante à cette date.

Détail : [`docs/bugs/BUG-022-health-liveness-redis.md`](../../bugs/BUG-022-health-liveness-redis.md).

## Limite connue

`BUG-024` reste ouverte : la readiness dépasse 10 secondes sans Redis. Elle ne
doit pas apparaître comme corrigée avant l'existence d'un correctif, d'un test,
d'une PR, d'une recette et d'une version publiée.

## SUP-001 - Chargement du tableau de bord après inscription

- source : retour ponctuel du porteur-test, reproduit ensuite de manière
  contrôlée ;
- commit correctif : `f0f581e` ;
- résultat local : session visible, attente bornée à 5 secondes, erreur
  actionnable et relance réussie ;
- tests : 4/4 ciblés, 104/104 frontend, 2/2 Playwright desktop/mobile, typage,
  lint et build réussis ;
- détail :
  [`docs/support/SUP-001-dashboard-loading-after-registration.md`](../../support/SUP-001-dashboard-loading-after-registration.md) ;
- état de livraison : correction locale de la PR #23 ; CI, recette Coolify et
  version publiée encore requises.
