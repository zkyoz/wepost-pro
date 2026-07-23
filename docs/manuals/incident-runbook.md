# Runbook incident

## Qualification

1. relever l’environnement, le composant, l’heure et le `correlation_id` ;
2. confirmer l’impact utilisateur avec liveness, readiness et `/admin/system` ;
3. classer : critique si authentification ou données indisponibles, majeur si publication/worker bloqué, mineur si intégration isolée ;
4. ouvrir une chronologie sans copier de secrets ni de contenu client.

## Diagnostic

- **API down** : vérifier le conteneur, la mémoire, le dernier déploiement et les logs ;
- **PostgreSQL down** : vérifier disponibilité, connexions, espace disque et migrations ;
- **Redis/file down** : vérifier Redis, la base de queue et les connexions BullMQ ;
- **worker sans heartbeat > 5 min** : vérifier le processus, Redis, PostgreSQL puis redémarrer le worker ;
- **R2 down** : vérifier l’état Cloudflare, le bucket et les secrets Coolify sans les afficher ;
- **e-mails/réseaux dégradés** : vérifier quotas, expiration OAuth et codes normalisés.

## Rétablissement

La relance d’un job s’effectue uniquement après correction de la cause. Elle conserve l’idempotence métier. Pour un incident lié au déploiement, utiliser le rollback Coolify, exécuter les smoke tests, confirmer les moniteurs puis documenter cause racine et test de non-régression.

## Clôture

Consigner impact, durée, cause, correction, preuve de rétablissement, actions préventives et SHA. Les destinataires et canaux d’alerte restent à valider avec l’agence.
