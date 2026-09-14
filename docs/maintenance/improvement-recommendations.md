# Recommandations d'amélioration C4.3.1

État de l'analyse : 14 août 2026. WePost n'est pas encore en production ; les
résultats locaux ne sont pas présentés comme un historique utilisateur ou un
SLO atteint.

## Signaux de départ

- `BUG-022` : liveness dépendant de Redis, correctif intégré et en attente de
  validation Coolify ;
- `BUG-024` : readiness supérieure à 10,005 secondes quand Redis est arrêté ;
- issue `#11` : avertissements Node.js 20 dans certaines actions GitHub ;
- p95, taux de 5xx et compteurs BullMQ disponibles mais non persistants ;
- quatre sondes Uptime Kuma validées localement, sans historique de production ;
- landing locale : Lighthouse 100, FCP 1,1 s, LCP 1,2 s et CLS 0 ;
- aucun panel d'utilisateurs externe ni enquête de satisfaction à cette date.
- `SUP-001` : le retour ponctuel de chargement après inscription a été reproduit
  de manière contrôlée et corrigé localement au commit `f0f581e` ; la CI et la
  recette persistante restent à réaliser.

## Plan priorisé

| ID    | Priorité | Action                                                          | Charge                                                        | Validation                                                                   |
| ----- | -------- | --------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| AM-01 | P1       | borner les probes et corriger `BUG-024`                         | 0,5 à 1 j                                                     | HTTP 503 en moins de 3 s sur 20 coupures                                     |
| AM-02 | P1       | instrumenter inscription/session et borner l'état de chargement | 2 à 3 j estimés ; attente bornée et relance déjà implémentées | 0 chargement supérieur à 5 s sur 30 scénarios ; 2/2 scénarios initiaux verts |
| AM-03 | P1       | historiser et alerter p95, 5xx, BullMQ, réseaux sociaux et R2   | 3 à 5 j                                                       | 5/5 familles et alertes reçues en moins de 5 min                             |
| AM-04 | P1       | valider Uptime Kuma et les fournisseurs sur la recette Coolify  | 2 à 4 j                                                       | 30 jours, disponibilité au moins 99,5 %, deux canaux testés                  |
| AM-05 | P2       | mener un pilote couvrant agence, client et administrateur       | 4 à 6 j sur 2 semaines                                        | au moins 5 participants, réussite 90 %, facilité 4/5                         |
| AM-06 | P2       | migrer les actions GitHub concernées par Node.js 20             | 0,5 à 1 j                                                     | aucun avertissement et CI entièrement verte                                  |

Convention de chiffrage documentaire : 500 euros HT/jour, soit 6 000 à
10 000 euros de travail pour 12 à 20 jours. Cette convention permet de comparer
les axes ; elle n'est ni une facture, ni le prix d'un abonnement. Les coûts
d'infrastructure et de fournisseurs doivent être remplacés par les offres
effectivement retenues.

## Bénéfice produit

L'ordre proposé améliore d'abord la confiance : pannes diagnostiquées plus
vite, aucun chargement sans issue, alertes exploitables et publication validée
avec les vrais fournisseurs. Le pilote permet ensuite de choisir les évolutions
UX sur des difficultés observées plutôt que sur des hypothèses.

Les objectifs de gain doivent être mesurés après mise en œuvre. Aucune hausse de
satisfaction, de disponibilité ou de performance n'est revendiquée avant cette
mesure.

Sources : issues
[#22](https://github.com/zkyoz/wepost-pro/issues/22),
[#24](https://github.com/zkyoz/wepost-pro/issues/24) et
[#11](https://github.com/zkyoz/wepost-pro/issues/11),
`docs/manuals/system-monitoring.md` et `docs/evidence/task23.md`.
Le cas `SUP-001` est décrit dans
[`docs/support/SUP-001-dashboard-loading-after-registration.md`](../support/SUP-001-dashboard-loading-after-registration.md).
