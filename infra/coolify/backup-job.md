# Job Coolify — sauvegarde PostgreSQL

Configurer une tâche planifiée sur le service API :

```text
Commande : pnpm backup:database
Planification proposée : 15 2 * * *
Fuseau : UTC
Concurrence : 1
```

L'image doit fournir `pg_dump` et `pg_restore` de PostgreSQL 17. Les variables
`BACKUP_*`, `BACKUP_R2_*` et `UPTIME_KUMA_BACKUP_PUSH_URL` sont des secrets du
service, jamais des arguments de commande.

Configurer séparément un restore drill mensuel dans l'environnement de recette.
Il doit viser une base temporaire créée avant le job et détruite après
validation. Aucun restore drill automatique ne doit pointer vers la production.
