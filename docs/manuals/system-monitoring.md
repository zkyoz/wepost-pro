# Manuel — Supervision système

## Endpoints

- `GET /health/live` confirme uniquement que le processus API répond ;
- `GET /health/ready` vérifie PostgreSQL, Redis et l’accès à la file ;
- `GET /api/v1/admin/system/status` fournit le détail technique à un administrateur ;
- `GET /api/v1/admin/system/metrics` expose les métriques agrégées protégées ;
- `POST /api/v1/admin/system/jobs/:jobId/retry` relance uniquement un job BullMQ échoué.

Le liveness ne dépend jamais d'un fournisseur externe. Une readiness indisponible renvoie HTTP 503. Les réponses techniques ne contiennent ni secret, ni token, ni payload de job.

Les routes `/health/live` et `/health/ready` sont placées hors de la chaîne de
middleware de session, CSRF et authentification. Les routes `/api/v1`
conservent cette chaîne. Une panne Redis doit donc laisser le liveness à
HTTP 200 et faire passer uniquement la readiness à HTTP 503.

## Dashboard

La page `/admin/system` affiche API, PostgreSQL, Redis, file, worker, R2 et e-mails, les compteurs waiting/active/delayed/failed, le p95 HTTP mesuré en mémoire et les erreurs sociales des dernières 24 heures. Les métriques en mémoire repartent à zéro lors d’un redémarrage : elles ne sont pas présentées comme un historique durable.

Le worker écrit un heartbeat dans Redis toutes les 60 secondes avec une expiration de 300 secondes. Il peut aussi alimenter un moniteur Push Uptime Kuma. Un administrateur peut relancer un job échoué ; l'action est limitée, journalisée et ne révèle pas les données du job.

## Seuils d'exploitation

| Indicateur | Avertissement | Critique |
| --- | --- | --- |
| Disponibilité mensuelle | budget consommé à 50 % | objectif inférieur à 99,5 % |
| API p95 | 400 ms | 500 ms sur plusieurs mesures |
| Erreurs HTTP 5xx | 1 % avec au moins 100 requêtes | 5 % avec au moins 100 requêtes |
| File `waiting` | plus de 10 pendant 5 min | plus de 50 pendant 5 min |
| Jobs `failed` | au moins 1 à qualifier | au moins 5 liés en 15 min |
| Worker | heartbeat âgé de 2 min | aucun heartbeat pendant 5 min |
| R2 | latence de 1 à 3 s | échec ou timeout à 3 s |

Le p95 et le taux d'erreur sont calculés en mémoire et repartent à zéro au
redémarrage. Leur affichage est opérationnel, mais leur historisation et leurs
notifications automatiques restent à ajouter avant la production.

## Alertes

Uptime Kuma contrôle le frontend, le liveness et la readiness toutes les
60 secondes. Il reçoit également le heartbeat Push du worker toutes les
60 secondes. Le frontend et le liveness sont déclarés hors ligne après trois
contrôles en échec, la readiness après deux, et le worker après cinq minutes
sans signal. Une alerte persistante est répétée environ toutes les 15 minutes.

Le webhook local a été validé le 8 août 2026. Il ne constitue pas un canal de
production. Deux canaux et un destinataire secondaire doivent être choisis
avant mise en service. L'enregistrement du corps d'erreur reste désactivé en
production.

## Corrélation

Chaque requête reçoit un en-tête `X-Correlation-ID`. Un identifiant sûr fourni par un proxy est conservé ; sinon l’API génère un UUID. Les logs structurés contiennent `correlation_id`, route, statut et durée. Les tokens de flux calendrier sont expurgés du chemin journalisé.
