# Preuves — Tâche 21

## Résumé

La tâche ajoute une supervision sans table de métriques : health checks, heartbeat worker, file BullMQ, état protégé des dépendances, métriques HTTP/processus en mémoire, relance limitée, Uptime Kuma et runbook incident.

## Fichiers structurants

- `app/services/system/system_status_service.ts` ;
- `app/middleware/correlation_middleware.ts` ;
- `app/services/system/queue_monitor.ts` ;
- `apps/worker/src/heartbeat.ts` ;
- `apps/web/app/pages/admin/system.vue` ;
- `infra/scripts/smoke-health.mjs` ;
- `infra/uptime-kuma/README.md`.

## Contrôles

| Contrôle               | Résultat mesuré                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| Tests API unitaires    | 92/92                                                                  |
| Tests API fonctionnels | 92/92                                                                  |
| Couverture API         | 184/184 — lignes 83,75 %, branches 71,46 %, fonctions 81,59 %          |
| Tests web              | 94/94 — lignes 85,66 %, branches 83,96 %, fonctions 78,42 %            |
| Tests worker           | 97/97 — lignes 92,23 %, branches 81,52 %, fonctions 86,29 %            |
| E2E Task 21 Chromium   | 1/1, aucune violation axe sérieuse ou critique                         |
| Qualité                | lint, format, typecheck et builds verts                                |
| Docker Compose         | configuration valide                                                   |
| Smoke local            | `/health/live` `ok` en 235,49 ms ; `/health/ready` `ready` en 47,06 ms |

Capture générée : `docs/evidence/task21/screenshots/system-status-desktop.png`.

Le test de relance HTTP emploie volontairement la file mémoire isolée : il vérifie le refus contrôlé du pilote qui ne permet pas la relance. Le chemin BullMQ persistant exige un job échoué réel en préproduction.

## Exercice local du 8 août 2026

Quatre moniteurs Uptime Kuma locaux ont été configurés à 60 secondes :
frontend, API liveness, readiness JSON et heartbeat worker. Un webhook local a
reçu le test, l'alerte readiness à 13:44:14, l'alerte worker à 13:44:35 et
l'alerte liveness à 13:44:44 après un arrêt contrôlé de Redis.

L'exercice a révélé que le middleware de session Redis traversait les routes de
health. Le correctif limite session, CSRF et initialisation auth au groupe
`/api/v1`. Les captures locales sont conservées dans
`docs/evidence/task21/screenshots/c4-1-2/`. Elles représentent quelques minutes
de test et non une disponibilité de production.

![Quatre sondes locales en ligne](screenshots/c4-1-2/01-uptime-kuma-etat-nominal.jpg)

![Alerte après arrêt contrôlé de Redis](screenshots/c4-1-2/02-alerte-redis-readiness.jpg)

![Retour au vert après rétablissement](screenshots/c4-1-2/03-retablissement.jpg)

## Limites

CPU et RAM concernent le processus API, pas tout le VPS. Les métriques HTTP sont une fenêtre mémoire et ne remplacent pas une base temporelle. L'alerte réelle est validée localement ; les canaux d'alerte, le domaine Uptime Kuma, la recette et le SHA restent à configurer en préproduction.
