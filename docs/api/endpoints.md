# Catalogue des endpoints Wepost.pro

> Fichier généré par `pnpm api:docs:generate`. Ne pas le modifier manuellement.

Nombre de routes documentées : **146**.

La documentation interactive est disponible sur `/api/docs` et le contrat OpenAPI sur
`/api/openapi.json` lorsque l’API est démarrée.

## Administration

| Méthode | Chemin                                   | Session | Permission     | Route Adonis                                |
| ------- | ---------------------------------------- | ------: | -------------- | ------------------------------------------- |
| GET     | `/api/v1/admin/audit-logs`               |     Oui | `users.manage` | `admin.admin_resources.audit_logs`          |
| GET     | `/api/v1/admin/backups`                  |     Oui | `users.manage` | `admin.admin_backups.index`                 |
| GET     | `/api/v1/admin/incidents`                |     Oui | `users.manage` | `admin.admin_resources.incidents`           |
| GET     | `/api/v1/admin/incidents/:id`            |     Oui | `users.manage` | `admin.admin_resources.incident`            |
| GET     | `/api/v1/admin/overview`                 |     Oui | `users.manage` | `admin.admin_resources.overview`            |
| GET     | `/api/v1/admin/projects`                 |     Oui | `users.manage` | `admin.admin_resources.projects`            |
| GET     | `/api/v1/admin/projects/:id`             |     Oui | `users.manage` | `admin.admin_resources.project`             |
| POST    | `/api/v1/admin/projects/:id/archive`     |     Oui | `users.manage` | `admin.admin_resources.archive_project`     |
| POST    | `/api/v1/admin/projects/:id/restore`     |     Oui | `users.manage` | `admin.admin_resources.restore_project`     |
| GET     | `/api/v1/admin/publications`             |     Oui | `users.manage` | `admin.admin_resources.publications`        |
| GET     | `/api/v1/admin/publications/:id`         |     Oui | `users.manage` | `admin.admin_resources.publication`         |
| POST    | `/api/v1/admin/publications/:id/archive` |     Oui | `users.manage` | `admin.admin_resources.archive_publication` |
| POST    | `/api/v1/admin/publications/:id/restore` |     Oui | `users.manage` | `admin.admin_resources.restore_publication` |
| GET     | `/api/v1/admin/social-accounts`          |     Oui | `users.manage` | `admin.admin_resources.social_accounts`     |
| GET     | `/api/v1/admin/social-accounts/:id`      |     Oui | `users.manage` | `admin.admin_resources.social_account`      |
| POST    | `/api/v1/admin/system/jobs/:jobId/retry` |     Oui | `users.manage` | `admin.admin_system.retry`                  |
| GET     | `/api/v1/admin/system/metrics`           |     Oui | `users.manage` | `admin.admin_system.metrics`                |
| GET     | `/api/v1/admin/system/status`            |     Oui | `users.manage` | `admin.admin_system.status`                 |
| GET     | `/api/v1/admin/users`                    |     Oui | `users.manage` | `admin.admin_users.index`                   |
| GET     | `/api/v1/admin/users/:id`                |     Oui | `users.manage` | `admin.admin_users.show`                    |
| PATCH   | `/api/v1/admin/users/:id/role`           |     Oui | `users.manage` | `admin.admin_users.update_role`             |
| PATCH   | `/api/v1/admin/users/:id/status`         |     Oui | `users.manage` | `admin.admin_users.update_status`           |

## Authentification

| Méthode | Chemin                  | Session | Permission | Route Adonis           |
| ------- | ----------------------- | ------: | ---------- | ---------------------- |
| GET     | `/api/v1/auth/csrf`     |     Non | —          | `auth.csrf`            |
| POST    | `/api/v1/auth/login`    |     Non | —          | `auth.session.store`   |
| POST    | `/api/v1/auth/logout`   |     Oui | —          | `auth.session.destroy` |
| GET     | `/api/v1/auth/me`       |     Oui | —          | `auth.me.show`         |
| POST    | `/api/v1/auth/register` |     Non | —          | `auth.register.store`  |

## Calendrier

| Méthode | Chemin                                   | Session | Permission        | Route Adonis                             |
| ------- | ---------------------------------------- | ------: | ----------------- | ---------------------------------------- |
| GET     | `/api/v1/calendar`                       |     Oui | `projects.read`   | `calendar.index`                         |
| GET     | `/api/v1/calendar/export.ics`            |     Oui | `calendar.export` | `calendar.export.calendar_feeds.export`  |
| GET     | `/api/v1/calendar/feeds`                 |     Oui | `calendar.export` | `calendar.export.calendar_feeds.index`   |
| POST    | `/api/v1/calendar/feeds`                 |     Oui | `calendar.export` | `calendar.export.calendar_feeds.store`   |
| DELETE  | `/api/v1/calendar/feeds/:id`             |     Oui | `calendar.export` | `calendar.export.calendar_feeds.destroy` |
| GET     | `/api/v1/calendar/feeds/:token`          |     Non | —                 | `calendar.feed.public`                   |
| POST    | `/api/v1/publications/:id/calendar/move` |     Oui | `projects.manage` | `calendar.move`                          |

## Collaboration

| Méthode | Chemin                                                           | Session | Permission        | Route Adonis          |
| ------- | ---------------------------------------------------------------- | ------: | ----------------- | --------------------- |
| PATCH   | `/api/v1/annotations/:id`                                        |     Oui | `projects.read`   | `annotations.update`  |
| DELETE  | `/api/v1/annotations/:id`                                        |     Oui | `projects.read`   | `annotations.destroy` |
| PATCH   | `/api/v1/comments/:id`                                           |     Oui | `projects.review` | `comments.update`     |
| DELETE  | `/api/v1/comments/:id`                                           |     Oui | `projects.review` | `comments.destroy`    |
| POST    | `/api/v1/publications/:id/comments`                              |     Oui | `projects.review` | `comments.store`      |
| POST    | `/api/v1/publications/:id/reviews`                               |     Oui | `projects.review` | `reviews.store`       |
| GET     | `/api/v1/publications/:publicationId/media/:mediaId/annotations` |     Oui | `projects.read`   | `annotations.index`   |
| POST    | `/api/v1/publications/:publicationId/media/:mediaId/annotations` |     Oui | `projects.read`   | `annotations.store`   |

## Documentation

| Méthode | Chemin              | Session | Permission | Route Adonis |
| ------- | ------------------- | ------: | ---------- | ------------ |
| GET     | `/api/docs`         |     Non | —          | `docs.ui`    |
| GET     | `/api/openapi.json` |     Non | —          | `docs.spec`  |

## IA

| Méthode | Chemin                                    | Session | Permission    | Route Adonis                           |
| ------- | ----------------------------------------- | ------: | ------------- | -------------------------------------- |
| GET     | `/api/v1/ai-generations/:id`              |     Oui | `ai.generate` | `ai-generations.ai_generations.show`   |
| POST    | `/api/v1/ai-generations/:id/apply`        |     Oui | `ai.generate` | `ai-generations.ai_generations.apply`  |
| POST    | `/api/v1/ai-generations/:id/cancel`       |     Oui | `ai.generate` | `ai-generations.ai_generations.cancel` |
| GET     | `/api/v1/publications/:id/ai-generations` |     Oui | `ai.generate` | `ai-generations.ai_generations.index`  |
| POST    | `/api/v1/publications/:id/ai-generations` |     Oui | `ai.generate` | `ai-generations.ai_generations.store`  |

## Médias

| Méthode | Chemin                                    | Session | Permission        | Route Adonis         |
| ------- | ----------------------------------------- | ------: | ----------------- | -------------------- |
| PATCH   | `/api/v1/media/:id`                       |     Oui | `projects.manage` | `media.update`       |
| DELETE  | `/api/v1/media/:id`                       |     Oui | `projects.manage` | `media.destroy`      |
| POST    | `/api/v1/media/:id/finalize`              |     Oui | `projects.manage` | `media.finalize`     |
| POST    | `/api/v1/media/:id/purge`                 |     Oui | `projects.manage` | `media.purge`        |
| GET     | `/api/v1/media/:id/read-url`              |     Oui | `projects.read`   | `media.read_url`     |
| GET     | `/api/v1/media/local-read`                |     Non | —                 | `media.local_read`   |
| PUT     | `/api/v1/media/local-upload`              |     Non | —                 | `media.local_upload` |
| GET     | `/api/v1/publications/:id/media`          |     Oui | `projects.read`   | `media.index`        |
| POST    | `/api/v1/publications/:id/media`          |     Oui | `projects.manage` | `media.attach`       |
| DELETE  | `/api/v1/publications/:id/media/:mediaId` |     Oui | `projects.manage` | `media.detach`       |
| PATCH   | `/api/v1/publications/:id/media/order`    |     Oui | `projects.manage` | `media.reorder`      |
| POST    | `/api/v1/publications/:id/media/uploads`  |     Oui | `projects.manage` | `media.initialize`   |

## Notifications

| Méthode | Chemin                      | Session | Permission | Route Adonis                         |
| ------- | --------------------------- | ------: | ---------- | ------------------------------------ |
| GET     | `/api/v1/notifications`     |     Oui | —          | `notifications.notifications.index`  |
| PATCH   | `/api/v1/notifications/:id` |     Oui | —          | `notifications.notifications.update` |

## Projets

| Méthode | Chemin                         | Session | Permission        | Route Adonis                       |
| ------- | ------------------------------ | ------: | ----------------- | ---------------------------------- |
| GET     | `/api/v1/projects`             |     Oui | `projects.read`   | `projects.projects.index`          |
| POST    | `/api/v1/projects`             |     Oui | `projects.manage` | `projects.manage.projects.store`   |
| GET     | `/api/v1/projects/:id`         |     Oui | `projects.read`   | `projects.projects.show`           |
| PATCH   | `/api/v1/projects/:id`         |     Oui | `projects.manage` | `projects.manage.projects.update`  |
| DELETE  | `/api/v1/projects/:id`         |     Oui | `projects.manage` | `projects.manage.projects.archive` |
| POST    | `/api/v1/projects/:id/restore` |     Oui | `projects.manage` | `projects.manage.projects.restore` |
| GET     | `/api/v1/projects/clients`     |     Oui | `projects.manage` | `projects.clients`                 |

## Publications

| Méthode | Chemin                                     | Session | Permission        | Route Adonis              |
| ------- | ------------------------------------------ | ------: | ----------------- | ------------------------- |
| GET     | `/api/v1/projects/:projectId/publications` |     Oui | `projects.read`   | `publications.index`      |
| POST    | `/api/v1/projects/:projectId/publications` |     Oui | `projects.manage` | `publications.store`      |
| GET     | `/api/v1/publications/:id`                 |     Oui | `projects.read`   | `publications.show`       |
| PATCH   | `/api/v1/publications/:id`                 |     Oui | `projects.manage` | `publications.update`     |
| POST    | `/api/v1/publications/:id/archive`         |     Oui | `projects.manage` | `publications.archive`    |
| GET     | `/api/v1/publications/:id/discussion`      |     Oui | `projects.read`   | `discussion.show`         |
| POST    | `/api/v1/publications/:id/duplicate`       |     Oui | `projects.manage` | `publications.duplicate`  |
| POST    | `/api/v1/publications/:id/transition`      |     Oui | `projects.manage` | `publications.transition` |

## Réseaux sociaux

| Méthode | Chemin                                               | Session | Permission      | Route Adonis                                         |
| ------- | ---------------------------------------------------- | ------: | --------------- | ---------------------------------------------------- |
| GET     | `/api/v1/social/facebook/accounts`                   |     Oui | `social.manage` | `social.facebook.manage.facebook.accounts`           |
| DELETE  | `/api/v1/social/facebook/accounts/:id`               |     Oui | `social.manage` | `social.facebook.manage.facebook.revoke`             |
| GET     | `/api/v1/social/facebook/oauth/callback`             |     Oui | `social.manage` | `social.facebook.manage.facebook.oauth_callback`     |
| POST    | `/api/v1/social/facebook/oauth/start`                |     Oui | `social.manage` | `social.facebook.manage.facebook.oauth_start`        |
| POST    | `/api/v1/social/facebook/publications/:id/schedule`  |     Oui | `social.manage` | `social.facebook.manage.facebook.schedule`           |
| GET     | `/api/v1/social/facebook/publications/:id/status`    |     Oui | `projects.read` | `social.facebook.read.facebook.publication_status`   |
| POST    | `/api/v1/social/facebook/publications/:id/validate`  |     Oui | `social.manage` | `social.facebook.manage.facebook.validate`           |
| GET     | `/api/v1/social/facebook/schedules/:id`              |     Oui | `projects.read` | `social.facebook.read.facebook.schedule_status`      |
| POST    | `/api/v1/social/facebook/schedules/:id/retry`        |     Oui | `social.manage` | `social.facebook.manage.facebook.retry`              |
| GET     | `/api/v1/social/instagram/accounts`                  |     Oui | `social.manage` | `social.instagram.manage.instagram.accounts`         |
| DELETE  | `/api/v1/social/instagram/accounts/:id`              |     Oui | `social.manage` | `social.instagram.manage.instagram.revoke`           |
| GET     | `/api/v1/social/instagram/oauth/callback`            |     Oui | `social.manage` | `social.instagram.manage.instagram.oauth_callback`   |
| POST    | `/api/v1/social/instagram/oauth/start`               |     Oui | `social.manage` | `social.instagram.manage.instagram.oauth_start`      |
| POST    | `/api/v1/social/instagram/publications/:id/schedule` |     Oui | `social.manage` | `social.instagram.manage.instagram.schedule`         |
| GET     | `/api/v1/social/instagram/publications/:id/status`   |     Oui | `projects.read` | `social.instagram.read.instagram.publication_status` |
| POST    | `/api/v1/social/instagram/publications/:id/validate` |     Oui | `social.manage` | `social.instagram.manage.instagram.validate`         |
| GET     | `/api/v1/social/instagram/schedules/:id`             |     Oui | `projects.read` | `social.instagram.read.instagram.schedule_status`    |
| POST    | `/api/v1/social/instagram/schedules/:id/retry`       |     Oui | `social.manage` | `social.instagram.manage.instagram.retry`            |
| GET     | `/api/v1/social/linkedin/accounts`                   |     Oui | `social.manage` | `social.linkedin.manage.linked_in.accounts`          |
| DELETE  | `/api/v1/social/linkedin/accounts/:id`               |     Oui | `social.manage` | `social.linkedin.manage.linked_in.revoke`            |
| POST    | `/api/v1/social/linkedin/accounts/:id/refresh`       |     Oui | `social.manage` | `social.linkedin.manage.linked_in.refresh`           |
| GET     | `/api/v1/social/linkedin/oauth/callback`             |     Oui | `social.manage` | `social.linkedin.manage.linked_in.oauth_callback`    |
| POST    | `/api/v1/social/linkedin/oauth/start`                |     Oui | `social.manage` | `social.linkedin.manage.linked_in.oauth_start`       |
| POST    | `/api/v1/social/linkedin/publications/:id/schedule`  |     Oui | `social.manage` | `social.linkedin.manage.linked_in.schedule`          |
| GET     | `/api/v1/social/linkedin/publications/:id/status`    |     Oui | `projects.read` | `social.linkedin.read.linked_in.publication_status`  |
| POST    | `/api/v1/social/linkedin/publications/:id/validate`  |     Oui | `social.manage` | `social.linkedin.manage.linked_in.validate`          |
| GET     | `/api/v1/social/linkedin/schedules/:id`              |     Oui | `projects.read` | `social.linkedin.read.linked_in.schedule_status`     |
| POST    | `/api/v1/social/linkedin/schedules/:id/retry`        |     Oui | `social.manage` | `social.linkedin.manage.linked_in.retry`             |
| GET     | `/api/v1/social/pinterest/accounts`                  |     Oui | `social.manage` | `social.pinterest.manage.pinterest.accounts`         |
| DELETE  | `/api/v1/social/pinterest/accounts/:id`              |     Oui | `social.manage` | `social.pinterest.manage.pinterest.revoke`           |
| POST    | `/api/v1/social/pinterest/accounts/:id/refresh`      |     Oui | `social.manage` | `social.pinterest.manage.pinterest.refresh`          |
| GET     | `/api/v1/social/pinterest/oauth/callback`            |     Oui | `social.manage` | `social.pinterest.manage.pinterest.oauth_callback`   |
| POST    | `/api/v1/social/pinterest/oauth/start`               |     Oui | `social.manage` | `social.pinterest.manage.pinterest.oauth_start`      |
| POST    | `/api/v1/social/pinterest/publications/:id/schedule` |     Oui | `social.manage` | `social.pinterest.manage.pinterest.schedule`         |
| GET     | `/api/v1/social/pinterest/publications/:id/status`   |     Oui | `projects.read` | `social.pinterest.read.pinterest.publication_status` |
| POST    | `/api/v1/social/pinterest/publications/:id/validate` |     Oui | `social.manage` | `social.pinterest.manage.pinterest.validate`         |
| GET     | `/api/v1/social/pinterest/schedules/:id`             |     Oui | `projects.read` | `social.pinterest.read.pinterest.schedule_status`    |
| POST    | `/api/v1/social/pinterest/schedules/:id/retry`       |     Oui | `social.manage` | `social.pinterest.manage.pinterest.retry`            |
| GET     | `/api/v1/social/tiktok/accounts`                     |     Oui | `social.manage` | `social.tiktok.manage.tik_tok.accounts`              |
| DELETE  | `/api/v1/social/tiktok/accounts/:id`                 |     Oui | `social.manage` | `social.tiktok.manage.tik_tok.revoke`                |
| POST    | `/api/v1/social/tiktok/accounts/:id/refresh`         |     Oui | `social.manage` | `social.tiktok.manage.tik_tok.refresh`               |
| GET     | `/api/v1/social/tiktok/oauth/callback`               |     Oui | `social.manage` | `social.tiktok.manage.tik_tok.oauth_callback`        |
| POST    | `/api/v1/social/tiktok/oauth/start`                  |     Oui | `social.manage` | `social.tiktok.manage.tik_tok.oauth_start`           |
| POST    | `/api/v1/social/tiktok/publications/:id/schedule`    |     Oui | `social.manage` | `social.tiktok.manage.tik_tok.schedule`              |
| GET     | `/api/v1/social/tiktok/publications/:id/status`      |     Oui | `projects.read` | `social.tiktok.read.tik_tok.publication_status`      |
| POST    | `/api/v1/social/tiktok/publications/:id/validate`    |     Oui | `social.manage` | `social.tiktok.manage.tik_tok.validate`              |
| GET     | `/api/v1/social/tiktok/schedules/:id`                |     Oui | `projects.read` | `social.tiktok.read.tik_tok.schedule_status`         |
| POST    | `/api/v1/social/tiktok/schedules/:id/retry`          |     Oui | `social.manage` | `social.tiktok.manage.tik_tok.retry`                 |

## Santé

| Méthode | Chemin          | Session | Permission | Route Adonis   |
| ------- | --------------- | ------: | ---------- | -------------- |
| GET     | `/health/live`  |     Non | —          | `health.live`  |
| GET     | `/health/ready` |     Non | —          | `health.ready` |

## Statistiques

| Méthode | Chemin                          | Session | Permission        | Route Adonis                   |
| ------- | ------------------------------- | ------: | ----------------- | ------------------------------ |
| GET     | `/api/v1/statistics`            |     Oui | `statistics.read` | `statistics.statistics.show`   |
| GET     | `/api/v1/statistics/export.csv` |     Oui | `statistics.read` | `statistics.statistics.export` |

## Supervision

| Méthode | Chemin                                       | Session | Permission         | Route Adonis                        |
| ------- | -------------------------------------------- | ------: | ------------------ | ----------------------------------- |
| GET     | `/api/v1/supervision/items`                  |     Oui | `supervision.read` | `supervision.supervision.items`     |
| PATCH   | `/api/v1/supervision/notifications/:id/read` |     Oui | `supervision.read` | `supervision.supervision.mark_read` |
| GET     | `/api/v1/supervision/summary`                |     Oui | `supervision.read` | `supervision.supervision.summary`   |

## Traductions

| Méthode | Chemin                                                  | Session | Permission            | Route Adonis                                |
| ------- | ------------------------------------------------------- | ------: | --------------------- | ------------------------------------------- |
| GET     | `/api/v1/publications/:id/translations`                 |     Oui | `projects.read`       | `translations.read`                         |
| PUT     | `/api/v1/publications/:id/translations/:locale`         |     Oui | `translations.manage` | `translations.manage.translations.update`   |
| POST    | `/api/v1/publications/:id/translations/:locale/approve` |     Oui | `translations.manage` | `translations.manage.translations.approve`  |
| POST    | `/api/v1/publications/:id/translations/generate`        |     Oui | `translations.manage` | `translations.manage.translations.generate` |
| PATCH   | `/api/v1/users/me/locale`                               |     Oui | —                     | `users.locale`                              |

## Utilisateurs

| Méthode | Chemin              | Session | Permission | Route Adonis |
| ------- | ------------------- | ------: | ---------- | ------------ |
| GET     | `/api/v1/users/:id` |     Oui | —          | `users.show` |

## Variantes réseau

| Méthode | Chemin                                                         | Session | Permission        | Route Adonis                                        |
| ------- | -------------------------------------------------------------- | ------: | ----------------- | --------------------------------------------------- |
| PATCH   | `/api/v1/network-variants/:id`                                 |     Oui | `ai.generate`     | `network-variants.manage.network_variants.update`   |
| POST    | `/api/v1/network-variants/:id/approve`                         |     Oui | `projects.review` | `network-variants.approve`                          |
| POST    | `/api/v1/network-variants/:id/stale`                           |     Oui | `ai.generate`     | `network-variants.manage.network_variants.stale`    |
| GET     | `/api/v1/publications/:id/network-variants`                    |     Oui | `projects.read`   | `network-variants.read.network_variants.index`      |
| POST    | `/api/v1/publications/:id/network-variants`                    |     Oui | `ai.generate`     | `network-variants.manage.network_variants.store`    |
| GET     | `/api/v1/publications/:id/network-variants/:network/effective` |     Oui | `projects.read`   | `network-variants.read.network_variants.effective`  |
| POST    | `/api/v1/publications/:id/network-variants/generate`           |     Oui | `ai.generate`     | `network-variants.manage.network_variants.generate` |
