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

## Limites

CPU et RAM concernent le processus API, pas tout le VPS. Les métriques HTTP sont une fenêtre mémoire et ne remplacent pas une base temporelle. Les canaux d’alerte, le domaine Uptime Kuma, la recette, le SHA et la simulation d’une alerte réelle restent à configurer en préproduction.
