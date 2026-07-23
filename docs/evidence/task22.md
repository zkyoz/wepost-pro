# Preuves — Tâche 22

## Résumé

La tâche ajoute un pipeline PostgreSQL chiffré vers un bucket R2 dédié, une
politique de rétention, un contrôle d'intégrité, une restauration isolée, un
journal durable et une page administrateur en lecture seule.

## Fichiers structurants

- `database/migrations/1784796000000_create_backup_runs.ts` ;
- `app/services/backups/database_backup_service.ts` ;
- `app/services/backups/backup_crypto.ts` ;
- `app/domain/backups/retention_policy.ts` ;
- `commands/backup_database.ts` ;
- `commands/backup_restore_drill.ts` ;
- `apps/web/app/pages/admin/backups.vue` ;
- `docs/manuals/backups-and-restore.md`.

## Tests locaux

- rétention quotidienne, hebdomadaire et mensuelle ;
- purge bornée au préfixe reconnu ;
- chiffrement, checksum et déchiffrement d'un dump simulé ;
- clé invalide et erreur inconnue expurgée ;
- alerte d'échec Uptime Kuma simulée ;
- historique administrateur et refus des autres rôles.

| Contrôle             | Résultat mesuré                                     |
| -------------------- | --------------------------------------------------- |
| Tests API            | 192/192                                             |
| Couverture API       | lignes 86,92 %, branches 71,84 %, fonctions 83,02 % |
| Tests web            | 95/95                                               |
| Couverture web       | lignes 85,71 %, branches 84,11 %, fonctions 78,53 % |
| Tests worker         | 97/97                                               |
| Couverture worker    | lignes 92,23 %, branches 81,52 %, fonctions 86,29 % |
| E2E Task 22 Chromium | 1/1, aucune violation axe sérieuse ou critique      |
| Qualité              | lint, format, typecheck et les trois builds verts   |

Capture générée :
`docs/evidence/task22/screenshots/backups-desktop.png`.

## Limites

Le bucket R2, le Bucket Lock, le cron Coolify, le dump réel et le restore drill
nécessitent les secrets et l'environnement de préproduction. Aucun de ces
éléments n'est présenté comme exécuté localement. Le SHA Git reste indisponible
tant que le dépôt n'est pas initialisé et commité.
