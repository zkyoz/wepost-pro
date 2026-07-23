# Manuel — Supervision système

## Endpoints

- `GET /health/live` confirme uniquement que le processus API répond ;
- `GET /health/ready` vérifie PostgreSQL, Redis et l’accès à la file ;
- `GET /api/v1/admin/system/status` fournit le détail technique à un administrateur ;
- `GET /api/v1/admin/system/metrics` expose les métriques agrégées protégées ;
- `POST /api/v1/admin/system/jobs/:jobId/retry` relance uniquement un job BullMQ échoué.

Le liveness ne dépend jamais d’un fournisseur externe. Une readiness indisponible renvoie HTTP 503. Les réponses techniques ne contiennent ni secret, ni token, ni payload de job.

## Dashboard

La page `/admin/system` affiche API, PostgreSQL, Redis, file, worker, R2 et e-mails, les compteurs waiting/active/delayed/failed, le p95 HTTP mesuré en mémoire et les erreurs sociales des dernières 24 heures. Les métriques en mémoire repartent à zéro lors d’un redémarrage : elles ne sont pas présentées comme un historique durable.

Le worker écrit un heartbeat dans Redis toutes les 60 secondes avec une expiration de 300 secondes. Il peut aussi alimenter un moniteur Push Uptime Kuma. Un administrateur peut relancer un job échoué ; l’action est limitée, journalisée et ne révèle pas les données du job.

## Corrélation

Chaque requête reçoit un en-tête `X-Correlation-ID`. Un identifiant sûr fourni par un proxy est conservé ; sinon l’API génère un UUID. Les logs structurés contiennent `correlation_id`, route, statut et durée. Les tokens de flux calendrier sont expurgés du chemin journalisé.
