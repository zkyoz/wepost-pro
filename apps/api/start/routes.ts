/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { PERMISSIONS } from '#domain/auth/permissions'
import {
  adminActionThrottle,
  aiGenerationThrottle,
  collaborationThrottle,
  calendarFeedThrottle,
  loginThrottle,
  registerThrottle,
  systemStatusThrottle,
} from '#start/limiter'
import router from '@adonisjs/core/services/router'

const HealthController = () => import('#controllers/health_controller')
const ApiDocsController = () => import('#controllers/api_docs_controller')
const CsrfController = () => import('#controllers/auth/csrf_controller')
const RegisterController = () => import('#controllers/auth/register_controller')
const SessionController = () => import('#controllers/auth/session_controller')
const MeController = () => import('#controllers/auth/me_controller')
const UsersController = () => import('#controllers/users_controller')
const AdminUsersController = () => import('#controllers/admin/users_controller')
const AdminResourcesController = () => import('#controllers/admin/resources_controller')
const AdminSystemController = () => import('#controllers/admin/system_controller')
const AdminBackupsController = () => import('#controllers/admin/backups_controller')
const ProjectsController = () => import('#controllers/projects_controller')
const PublicationsController = () => import('#controllers/publications_controller')
const MediaController = () => import('#controllers/media_controller')
const CalendarController = () => import('#controllers/calendar_controller')
const DiscussionController = () => import('#controllers/discussion_controller')
const CommentsController = () => import('#controllers/comments_controller')
const ReviewsController = () => import('#controllers/reviews_controller')
const NotificationsController = () => import('#controllers/notifications_controller')
const FacebookController = () => import('#controllers/facebook_controller')
const InstagramController = () => import('#controllers/instagram_controller')
const LinkedInController = () => import('#controllers/linkedin_controller')
const PinterestController = () => import('#controllers/pinterest_controller')
const TikTokController = () => import('#controllers/tiktok_controller')
const SupervisionController = () => import('#controllers/supervision_controller')
const StatisticsController = () => import('#controllers/statistics_controller')
const AiGenerationsController = () => import('#controllers/ai_generations_controller')
const NetworkVariantsController = () => import('#controllers/network_variants_controller')
const AnnotationsController = () => import('#controllers/annotations_controller')
const CalendarFeedsController = () => import('#controllers/calendar_feeds_controller')
const LocalesController = () => import('#controllers/locales_controller')
const TranslationsController = () => import('#controllers/translations_controller')

router.get('/health/live', [HealthController, 'live'])
router.get('/health/ready', [HealthController, 'ready'])
router.get('/api/docs', [ApiDocsController, 'show']).as('docs.ui')
router.get('/api/openapi.json', [ApiDocsController, 'spec']).as('docs.spec')

router
  .group(() => {
    router.get('auth/csrf', [CsrfController, 'show']).as('auth.csrf')
    router
      .get('calendar/feeds/:token', [CalendarFeedsController, 'show'])
      .as('calendar.feed.public')
      .use(calendarFeedThrottle)
    router.put('media/local-upload', [MediaController, 'localUpload'])
    router.get('media/local-read', [MediaController, 'localRead'])

    router
      .get('projects/clients', [ProjectsController, 'clients'])
      .as('projects.clients')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsManage] }))

    router
      .group(() => {
        router.post('register', [RegisterController, 'store']).use(registerThrottle)
        router.post('login', [SessionController, 'store']).use(loginThrottle)
      })
      .prefix('auth')
      .as('auth')
      .use(middleware.guest())

    router
      .group(() => {
        router.get('me', [MeController, 'show'])
        router.post('logout', [SessionController, 'destroy'])
      })
      .prefix('auth')
      .as('auth')
      .use(middleware.auth({ guards: ['web'] }))

    router
      .get('users/:id', [UsersController, 'show'])
      .as('users.show')
      .use(middleware.auth({ guards: ['web'] }))

    router
      .patch('users/me/locale', [LocalesController, 'update'])
      .as('users.locale')
      .use(middleware.auth({ guards: ['web'] }))

    router
      .group(() => {
        router.get('publications/:id/status', [FacebookController, 'publicationStatus'])
        router.get('schedules/:id', [FacebookController, 'scheduleStatus'])
      })
      .prefix('social/facebook')
      .as('social.facebook.read')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsRead] }))

    router
      .group(() => {
        router.post('oauth/start', [FacebookController, 'oauthStart']).use(collaborationThrottle)
        router.get('oauth/callback', [FacebookController, 'oauthCallback'])
        router.get('accounts', [FacebookController, 'accounts'])
        router.delete('accounts/:id', [FacebookController, 'revoke'])
        router.post('publications/:id/validate', [FacebookController, 'validate'])
        router.post('publications/:id/schedule', [FacebookController, 'schedule'])
        router.post('schedules/:id/retry', [FacebookController, 'retry']).use(collaborationThrottle)
      })
      .prefix('social/facebook')
      .as('social.facebook.manage')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.socialManage] }))

    router
      .group(() => {
        router.get('publications/:id/status', [PinterestController, 'publicationStatus'])
        router.get('schedules/:id', [PinterestController, 'scheduleStatus'])
      })
      .prefix('social/pinterest')
      .as('social.pinterest.read')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsRead] }))

    router
      .group(() => {
        router.post('oauth/start', [PinterestController, 'oauthStart']).use(collaborationThrottle)
        router.get('oauth/callback', [PinterestController, 'oauthCallback'])
        router.get('accounts', [PinterestController, 'accounts'])
        router.post('accounts/:id/refresh', [PinterestController, 'refresh'])
        router.delete('accounts/:id', [PinterestController, 'revoke'])
        router.post('publications/:id/validate', [PinterestController, 'validate'])
        router.post('publications/:id/schedule', [PinterestController, 'schedule'])
        router
          .post('schedules/:id/retry', [PinterestController, 'retry'])
          .use(collaborationThrottle)
      })
      .prefix('social/pinterest')
      .as('social.pinterest.manage')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.socialManage] }))

    router
      .group(() => {
        router.get('publications/:id/status', [TikTokController, 'publicationStatus'])
        router.get('schedules/:id', [TikTokController, 'scheduleStatus'])
      })
      .prefix('social/tiktok')
      .as('social.tiktok.read')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsRead] }))

    router
      .group(() => {
        router.post('oauth/start', [TikTokController, 'oauthStart']).use(collaborationThrottle)
        router.get('oauth/callback', [TikTokController, 'oauthCallback'])
        router.get('accounts', [TikTokController, 'accounts'])
        router.post('accounts/:id/refresh', [TikTokController, 'refresh'])
        router.delete('accounts/:id', [TikTokController, 'revoke'])
        router.post('publications/:id/validate', [TikTokController, 'validate'])
        router.post('publications/:id/schedule', [TikTokController, 'schedule'])
        router.post('schedules/:id/retry', [TikTokController, 'retry']).use(collaborationThrottle)
      })
      .prefix('social/tiktok')
      .as('social.tiktok.manage')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.socialManage] }))

    router
      .group(() => {
        router.get('publications/:id/status', [LinkedInController, 'publicationStatus'])
        router.get('schedules/:id', [LinkedInController, 'scheduleStatus'])
      })
      .prefix('social/linkedin')
      .as('social.linkedin.read')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsRead] }))

    router
      .group(() => {
        router.post('oauth/start', [LinkedInController, 'oauthStart']).use(collaborationThrottle)
        router.get('oauth/callback', [LinkedInController, 'oauthCallback'])
        router.get('accounts', [LinkedInController, 'accounts'])
        router.post('accounts/:id/refresh', [LinkedInController, 'refresh'])
        router.delete('accounts/:id', [LinkedInController, 'revoke'])
        router.post('publications/:id/validate', [LinkedInController, 'validate'])
        router.post('publications/:id/schedule', [LinkedInController, 'schedule'])
        router.post('schedules/:id/retry', [LinkedInController, 'retry']).use(collaborationThrottle)
      })
      .prefix('social/linkedin')
      .as('social.linkedin.manage')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.socialManage] }))

    router
      .group(() => {
        router.get('publications/:id/status', [InstagramController, 'publicationStatus'])
        router.get('schedules/:id', [InstagramController, 'scheduleStatus'])
      })
      .prefix('social/instagram')
      .as('social.instagram.read')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsRead] }))

    router
      .group(() => {
        router.post('oauth/start', [InstagramController, 'oauthStart']).use(collaborationThrottle)
        router.get('oauth/callback', [InstagramController, 'oauthCallback'])
        router.get('accounts', [InstagramController, 'accounts'])
        router.delete('accounts/:id', [InstagramController, 'revoke'])
        router.post('publications/:id/validate', [InstagramController, 'validate'])
        router.post('publications/:id/schedule', [InstagramController, 'schedule'])
        router
          .post('schedules/:id/retry', [InstagramController, 'retry'])
          .use(collaborationThrottle)
      })
      .prefix('social/instagram')
      .as('social.instagram.manage')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.socialManage] }))

    router
      .group(() => {
        router.get('overview', [AdminResourcesController, 'overview'])
        router.get('users', [AdminUsersController, 'index'])
        router.get('users/:id', [AdminUsersController, 'show'])
        router
          .patch('users/:id/role', [AdminUsersController, 'updateRole'])
          .use(adminActionThrottle)
        router
          .patch('users/:id/status', [AdminUsersController, 'updateStatus'])
          .use(adminActionThrottle)
        router.get('projects', [AdminResourcesController, 'projects'])
        router.get('projects/:id', [AdminResourcesController, 'project'])
        router
          .post('projects/:id/archive', [AdminResourcesController, 'archiveProject'])
          .use(adminActionThrottle)
        router
          .post('projects/:id/restore', [AdminResourcesController, 'restoreProject'])
          .use(adminActionThrottle)
        router.get('publications', [AdminResourcesController, 'publications'])
        router.get('publications/:id', [AdminResourcesController, 'publication'])
        router
          .post('publications/:id/archive', [AdminResourcesController, 'archivePublication'])
          .use(adminActionThrottle)
        router
          .post('publications/:id/restore', [AdminResourcesController, 'restorePublication'])
          .use(adminActionThrottle)
        router.get('social-accounts', [AdminResourcesController, 'socialAccounts'])
        router.get('social-accounts/:id', [AdminResourcesController, 'socialAccount'])
        router.get('incidents', [AdminResourcesController, 'incidents'])
        router.get('incidents/:id', [AdminResourcesController, 'incident'])
        router.get('audit-logs', [AdminResourcesController, 'auditLogs'])
        router.get('system/status', [AdminSystemController, 'status']).use(systemStatusThrottle)
        router.get('system/metrics', [AdminSystemController, 'metrics']).use(systemStatusThrottle)
        router.get('backups', [AdminBackupsController, 'index']).use(systemStatusThrottle)
        router
          .post('system/jobs/:jobId/retry', [AdminSystemController, 'retry'])
          .use(adminActionThrottle)
      })
      .prefix('admin')
      .as('admin')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.usersManage] }))

    router
      .group(() => {
        router.get('summary', [SupervisionController, 'summary'])
        router.get('items', [SupervisionController, 'items'])
        router
          .patch('notifications/:id/read', [SupervisionController, 'markRead'])
          .use(collaborationThrottle)
      })
      .prefix('supervision')
      .as('supervision')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.supervisionRead] }))

    router
      .group(() => {
        router.get('/', [StatisticsController, 'show'])
        router.get('export.csv', [StatisticsController, 'export'])
      })
      .prefix('statistics')
      .as('statistics')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.statisticsRead] }))

    router
      .group(() => {
        router.get('export.ics', [CalendarFeedsController, 'export'])
        router.get('feeds', [CalendarFeedsController, 'index'])
        router.post('feeds', [CalendarFeedsController, 'store']).use(collaborationThrottle)
        router.delete('feeds/:id', [CalendarFeedsController, 'destroy'])
      })
      .prefix('calendar')
      .as('calendar.export')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.calendarExport] }))

    router
      .group(() => {
        router.get('publications/:id/ai-generations', [AiGenerationsController, 'index'])
        router
          .post('publications/:id/ai-generations', [AiGenerationsController, 'store'])
          .use(aiGenerationThrottle)
        router.get('ai-generations/:id', [AiGenerationsController, 'show'])
        router.post('ai-generations/:id/apply', [AiGenerationsController, 'apply'])
        router.post('ai-generations/:id/cancel', [AiGenerationsController, 'cancel'])
      })
      .as('ai-generations')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.aiGenerate] }))

    router
      .group(() => {
        router.get('publications/:id/network-variants', [NetworkVariantsController, 'index'])
        router.get('publications/:id/network-variants/:network/effective', [
          NetworkVariantsController,
          'effective',
        ])
      })
      .as('network-variants.read')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsRead] }))

    router
      .get('publications/:id/translations', [TranslationsController, 'index'])
      .as('translations.read')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsRead] }))

    router
      .group(() => {
        router
          .post('publications/:id/translations/generate', [TranslationsController, 'generate'])
          .use(aiGenerationThrottle)
        router.put('publications/:id/translations/:locale', [TranslationsController, 'update'])
        router.post('publications/:id/translations/:locale/approve', [
          TranslationsController,
          'approve',
        ])
      })
      .as('translations.manage')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.translationsManage] }))

    router
      .post('network-variants/:id/approve', [NetworkVariantsController, 'approve'])
      .as('network-variants.approve')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsReview] }))

    router
      .group(() => {
        router.post('publications/:id/network-variants', [NetworkVariantsController, 'store'])
        router
          .post('publications/:id/network-variants/generate', [
            NetworkVariantsController,
            'generate',
          ])
          .use(aiGenerationThrottle)
        router.patch('network-variants/:id', [NetworkVariantsController, 'update'])
        router.post('network-variants/:id/stale', [NetworkVariantsController, 'stale'])
      })
      .as('network-variants.manage')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.aiGenerate] }))

    router
      .group(() => {
        router.get('/', [ProjectsController, 'index'])
        router.get('/:id', [ProjectsController, 'show'])
      })
      .prefix('projects')
      .as('projects')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsRead] }))

    router
      .group(() => {
        router.post('/', [ProjectsController, 'store'])
        router.patch('/:id', [ProjectsController, 'update'])
        router.delete('/:id', [ProjectsController, 'archive'])
        router.post('/:id/restore', [ProjectsController, 'restore'])
      })
      .prefix('projects')
      .as('projects.manage')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsManage] }))

    router
      .group(() => {
        router.get('calendar', [CalendarController, 'index'])
        router.get('projects/:projectId/publications', [PublicationsController, 'index'])
        router.get('publications/:id', [PublicationsController, 'show'])
        router.get('publications/:id/discussion', [DiscussionController, 'show'])
        router.get('publications/:id/media', [MediaController, 'index'])
        router.get('media/:id/read-url', [MediaController, 'readUrl'])
        router.get('publications/:publicationId/media/:mediaId/annotations', [
          AnnotationsController,
          'index',
        ])
      })
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsRead] }))

    router
      .group(() => {
        router
          .post('publications/:id/comments', [CommentsController, 'store'])
          .use(collaborationThrottle)
        router.patch('comments/:id', [CommentsController, 'update'])
        router.delete('comments/:id', [CommentsController, 'destroy'])
        router
          .post('publications/:id/reviews', [ReviewsController, 'store'])
          .use(collaborationThrottle)
      })
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsReview] }))

    router
      .group(() => {
        router
          .post('publications/:publicationId/media/:mediaId/annotations', [
            AnnotationsController,
            'store',
          ])
          .use(collaborationThrottle)
        router.patch('annotations/:id', [AnnotationsController, 'update'])
        router.delete('annotations/:id', [AnnotationsController, 'destroy'])
      })
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsRead] }))

    router
      .group(() => {
        router.get('/', [NotificationsController, 'index'])
        router.patch('/:id', [NotificationsController, 'update'])
      })
      .prefix('notifications')
      .as('notifications')
      .use(middleware.auth({ guards: ['web'] }))

    router
      .group(() => {
        router.post('projects/:projectId/publications', [PublicationsController, 'store'])
        router.patch('publications/:id', [PublicationsController, 'update'])
        router.post('publications/:id/duplicate', [PublicationsController, 'duplicate'])
        router.post('publications/:id/archive', [PublicationsController, 'archive'])
        router.post('publications/:id/transition', [PublicationsController, 'transition'])
        router.post('publications/:id/calendar/move', [CalendarController, 'move'])
        router.post('publications/:id/media/uploads', [MediaController, 'initialize'])
        router.post('media/:id/finalize', [MediaController, 'finalize'])
        router.post('publications/:id/media', [MediaController, 'attach'])
        router.patch('media/:id', [MediaController, 'update'])
        router.patch('publications/:id/media/order', [MediaController, 'reorder'])
        router.delete('publications/:id/media/:mediaId', [MediaController, 'detach'])
        router.delete('media/:id', [MediaController, 'destroy'])
        router.post('media/:id/purge', [MediaController, 'purge'])
      })
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.permission({ permissions: [PERMISSIONS.projectsManage] }))
  })
  .prefix('/api/v1')
  .use(middleware.session())
  .use(middleware.shield())
  .use(middleware.initializeAuth())
  .use(middleware.silentAuth())
