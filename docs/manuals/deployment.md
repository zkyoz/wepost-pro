# Manuel de déploiement

## Local

Prérequis : Node 24, pnpm 11 et Docker.

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
pnpm install --frozen-lockfile
pnpm infra:up
pnpm db:migrate
pnpm dev
```

PostgreSQL écoute sur `5432`, Redis sur `6379`, l’API sur `3333` et Nuxt sur `3000`. Le fichier d’initialisation Docker crée aussi `wepost_test` sur un volume neuf.

Le worker est lancé séparément avec `pnpm dev:worker`. Sans clé Resend locale, laisser ce processus arrêté ; l’API et les tests utilisent un driver de file mémoire uniquement en environnement de test.

## Contrôles avant promotion

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm test:e2e
pnpm audit --audit-level high
```

La CI reproduit ces contrôles avec PostgreSQL 17 et Redis 7. Les rapports de couverture et Playwright sont archivés.

## Recette et production

Créer des secrets et ressources distincts par environnement : `APP_KEY`, base PostgreSQL, bases/préfixes Redis, nom de cookie et variables Coolify. Ne jamais réutiliser l’`APP_KEY` de la CI.

Créer également un bucket R2 privé par environnement (ou, au minimum, un préfixe strictement distinct), appliquer la CORS de `infra/coolify/r2-cors.example.json`, puis renseigner les variables décrites dans `docs/manuals/media.md`. Aucun secret R2 ne doit être injecté dans Nuxt.

Pour le schéma `app.wepost.pro` / `api.wepost.pro` :

```text
NODE_ENV=production
APP_URL=https://api.wepost.pro
SESSION_DRIVER=redis
SESSION_COOKIE_DOMAIN=.wepost.pro
CORS_ORIGINS=https://app.wepost.pro
NUXT_PUBLIC_API_BASE=https://api.wepost.pro/api/v1
EMAIL_QUEUE_DRIVER=redis
EMAIL_QUEUE_NAME=wepost-jobs
REDIS_QUEUE_DB=2
REDIS_KEY_PREFIX=wepost:production
WEB_APP_URL=https://app.wepost.pro
EMAIL_FROM=Wepost.pro <notifications@wepost.pro>
```

Déployer `apps/worker` comme service Coolify séparé, sans exposition HTTP. Lui fournir les variables PostgreSQL/Redis communes, `RESEND_API_KEY`, `EMAIL_FROM`, `WEB_APP_URL`, `EMAIL_QUEUE_NAME`, `REDIS_QUEUE_DB` et `REDIS_KEY_PREFIX`. Le redémarrage du worker ne doit pas redémarrer l’API.

Pour Facebook, ajouter à l’API et au worker une clé `SOCIAL_TOKEN_ENCRYPTION_KEY` distincte par environnement. Configurer `FACEBOOK_API_DRIVER=facebook`, les identifiants d’application, la version Graph réellement active et les URI OAuth exactes décrites dans `docs/manuals/facebook-publishing.md`. Le worker reçoit aussi les accès R2 privés. Le driver `mock` et la version `v-test` sont interdits en recette/production.

Pour Instagram, réutiliser cette clé côté API et worker puis configurer `INSTAGRAM_API_DRIVER=instagram`, l’application Meta, la version Graph active et les URI décrites dans `docs/manuals/instagram-publishing.md`. Le compte doit être Business ou Creator et lié à une Page Facebook. Le worker doit pouvoir signer en lecture les objets R2 privés. Le driver `mock` et la version `v-test` sont interdits en recette/production.

Pour LinkedIn, configurer `LINKEDIN_API_DRIVER=linkedin`, les identifiants de l’application, une version active au format `YYYYMM` et les URI décrites dans `docs/manuals/linkedin-publishing.md`. Fournir au worker la version et les accès R2 privés. Vérifier l’accès Community Management, les scopes et l’organisation de test avant activation ; le driver `mock` et une version de test sont interdits en recette/production.

Pour Pinterest, configurer `PINTEREST_API_DRIVER=pinterest`, les identifiants d’application, `PINTEREST_API_BASE_URL=https://api.pinterest.com/v5` et les URI décrites dans `docs/manuals/pinterest-publishing.md`. Fournir au worker l’URL API et les accès R2 privés. Vérifier les scopes et un tableau de test avant activation ; le driver `mock` est interdit en recette/production.

Pour TikTok, configurer `TIKTOK_API_DRIVER=tiktok`, la clé/client secret de l’application, `TIKTOK_API_BASE_URL=https://open.tiktokapis.com` et les URI décrites dans `docs/manuals/tiktok-publishing.md`. Fournir au worker le driver, l’URL API, la clé de chiffrement et les accès R2 privés. Vérifier Content Posting API, `video.publish`, le statut d’audit et un compte de test ; `mock` est interdit hors tests.

Pour les sauvegardes, fournir `pg_dump` et `pg_restore` PostgreSQL 17 dans
l'image API, créer un bucket et des credentials R2 dédiés, puis configurer la
tâche Coolify décrite dans `infra/coolify/backup-job.md`. Les variables
`BACKUP_*` ne doivent pas réutiliser les credentials média. Exécuter un restore
drill sur une base jetable avant toute validation de production ; la procédure
complète figure dans `docs/manuals/backups-and-restore.md`.

Étapes de promotion :

1. construire les images depuis le SHA à livrer ;
2. exécuter `node ace migration:run --force` avant la promotion complète ;
3. démarrer l’API, le worker puis Nuxt ;
4. vérifier `/health/live`, l’authentification, un cycle d’upload R2, un e-mail et une publication Facebook, Instagram, LinkedIn, Pinterest et TikTok sur des comptes de test sans contenu sensible ;
5. vérifier dans le navigateur les attributs du cookie sans capturer sa valeur ;
6. consigner le SHA et le résultat de la recette.

Rollback : redéployer l’image Coolify précédente. Une migration destructive exige une procédure dédiée. La migration de tâche 12 est réversible, mais son retour arrière supprime le suivi `publish_id`/statut : attendre ou annuler les traitements TikTok en cours avant toute descente de version.
