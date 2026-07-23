# Sécurité — Tâche 02

## Mesures implémentées

- matrice de permissions centralisée et deny-by-default ;
- middleware `auth` puis `permission` sur toutes les routes administrateur ;
- règles de portée centralisées pour utilisateur et futur projet ;
- réponse `404` générique sur une ressource hors périmètre afin de limiter l’énumération ;
- validation UUID, enum de rôle et booléen VineJS ;
- refus de l’auto-modification du rôle et de l’auto-désactivation ;
- invalidation de l’utilisation d’une session dès que `is_active` devient faux ;
- changements de rôle et d’état réalisés avec leur journal d’audit dans une transaction ;
- aucun endpoint de modification ou suppression des `audit_logs` ;
- journal structuré des refus avec identifiant utilisateur, route et permission, sans donnée métier privée.

## Tests exécutés

- admin autorisé, agence et client refusés sur l’administration ;
- enum invalide refusée ;
- auto-modification refusée ;
- session existante refusée après désactivation ;
- client limité à son propre profil ;
- agence limitée à son `agency_id` ;
- CSRF, CORS, session et rate limiting de la tâche 01 rejoués sans régression.

## Observabilité et limites

Le middleware émet `authorization.denied` et incrémente le compteur de processus `authorization_denied_total`. Une intégration Prometheus/OpenTelemetry et une alerte restent à réaliser avec la supervision système. Les journaux d’audit sont append-only au niveau applicatif ; un durcissement par privilège PostgreSQL dédié pourra être ajouté avant la production.

Le CRUD projet n’existe pas encore. La règle anti-IDOR projet est testée sur un contrat de portée et devra être appliquée aux requêtes de la tâche 03.
