import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health.live': { paramsTuple?: []; params?: {} }
    'health.ready': { paramsTuple?: []; params?: {} }
    'docs.ui': { paramsTuple?: []; params?: {} }
    'docs.spec': { paramsTuple?: []; params?: {} }
    'auth.csrf': { paramsTuple?: []; params?: {} }
    'calendar.feed.public': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'media.local_upload': { paramsTuple?: []; params?: {} }
    'media.local_read': { paramsTuple?: []; params?: {} }
    'projects.clients': { paramsTuple?: []; params?: {} }
    'auth.register.store': { paramsTuple?: []; params?: {} }
    'auth.session.store': { paramsTuple?: []; params?: {} }
    'auth.me.show': { paramsTuple?: []; params?: {} }
    'auth.session.destroy': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.locale': { paramsTuple?: []; params?: {} }
    'social.facebook.read.facebook.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.read.facebook.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.manage.facebook.oauth_start': { paramsTuple?: []; params?: {} }
    'social.facebook.manage.facebook.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.facebook.manage.facebook.accounts': { paramsTuple?: []; params?: {} }
    'social.facebook.manage.facebook.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.manage.facebook.validate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.manage.facebook.schedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.manage.facebook.retry': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.read.pinterest.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.read.pinterest.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.manage.pinterest.oauth_start': { paramsTuple?: []; params?: {} }
    'social.pinterest.manage.pinterest.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.pinterest.manage.pinterest.accounts': { paramsTuple?: []; params?: {} }
    'social.pinterest.manage.pinterest.refresh': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.manage.pinterest.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.manage.pinterest.validate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.manage.pinterest.schedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.manage.pinterest.retry': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.read.tik_tok.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.read.tik_tok.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.manage.tik_tok.oauth_start': { paramsTuple?: []; params?: {} }
    'social.tiktok.manage.tik_tok.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.tiktok.manage.tik_tok.accounts': { paramsTuple?: []; params?: {} }
    'social.tiktok.manage.tik_tok.refresh': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.manage.tik_tok.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.manage.tik_tok.validate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.manage.tik_tok.schedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.manage.tik_tok.retry': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.read.linked_in.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.read.linked_in.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.manage.linked_in.oauth_start': { paramsTuple?: []; params?: {} }
    'social.linkedin.manage.linked_in.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.linkedin.manage.linked_in.accounts': { paramsTuple?: []; params?: {} }
    'social.linkedin.manage.linked_in.refresh': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.manage.linked_in.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.manage.linked_in.validate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.manage.linked_in.schedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.manage.linked_in.retry': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.read.instagram.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.read.instagram.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.manage.instagram.oauth_start': { paramsTuple?: []; params?: {} }
    'social.instagram.manage.instagram.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.instagram.manage.instagram.accounts': { paramsTuple?: []; params?: {} }
    'social.instagram.manage.instagram.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.manage.instagram.validate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.manage.instagram.schedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.manage.instagram.retry': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.overview': { paramsTuple?: []; params?: {} }
    'admin.admin_users.index': { paramsTuple?: []; params?: {} }
    'admin.admin_users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_users.update_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_users.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.projects': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.project': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.archive_project': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.restore_project': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.publications': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.publication': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.archive_publication': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.restore_publication': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.social_accounts': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.social_account': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.incidents': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.incident': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.audit_logs': { paramsTuple?: []; params?: {} }
    'admin.admin_system.status': { paramsTuple?: []; params?: {} }
    'admin.admin_system.metrics': { paramsTuple?: []; params?: {} }
    'admin.admin_backups.index': { paramsTuple?: []; params?: {} }
    'admin.admin_system.retry': { paramsTuple: [ParamValue]; params: {'jobId': ParamValue} }
    'supervision.supervision.summary': { paramsTuple?: []; params?: {} }
    'supervision.supervision.items': { paramsTuple?: []; params?: {} }
    'supervision.supervision.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'statistics.statistics.show': { paramsTuple?: []; params?: {} }
    'statistics.statistics.export': { paramsTuple?: []; params?: {} }
    'calendar.export.calendar_feeds.export': { paramsTuple?: []; params?: {} }
    'calendar.export.calendar_feeds.index': { paramsTuple?: []; params?: {} }
    'calendar.export.calendar_feeds.store': { paramsTuple?: []; params?: {} }
    'calendar.export.calendar_feeds.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ai-generations.ai_generations.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ai-generations.ai_generations.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ai-generations.ai_generations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ai-generations.ai_generations.apply': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ai-generations.ai_generations.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.read.network_variants.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.read.network_variants.effective': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'network': ParamValue} }
    'translations.read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'translations.manage.translations.generate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'translations.manage.translations.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'locale': ParamValue} }
    'translations.manage.translations.approve': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'locale': ParamValue} }
    'network-variants.approve': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.manage.network_variants.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.manage.network_variants.generate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.manage.network_variants.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.manage.network_variants.stale': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projects.projects.index': { paramsTuple?: []; params?: {} }
    'projects.projects.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projects.manage.projects.store': { paramsTuple?: []; params?: {} }
    'projects.manage.projects.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projects.manage.projects.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projects.manage.projects.restore': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'calendar.index': { paramsTuple?: []; params?: {} }
    'publications.index': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'publications.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'discussion.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.read_url': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'annotations.index': { paramsTuple: [ParamValue,ParamValue]; params: {'publicationId': ParamValue,'mediaId': ParamValue} }
    'comments.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'comments.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'comments.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reviews.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'annotations.store': { paramsTuple: [ParamValue,ParamValue]; params: {'publicationId': ParamValue,'mediaId': ParamValue} }
    'annotations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'annotations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.notifications.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'publications.store': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'publications.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'publications.duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'publications.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'publications.transition': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'calendar.move': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.initialize': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.finalize': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.attach': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.reorder': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.detach': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'mediaId': ParamValue} }
    'media.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.purge': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'health.live': { paramsTuple?: []; params?: {} }
    'health.ready': { paramsTuple?: []; params?: {} }
    'docs.ui': { paramsTuple?: []; params?: {} }
    'docs.spec': { paramsTuple?: []; params?: {} }
    'auth.csrf': { paramsTuple?: []; params?: {} }
    'calendar.feed.public': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'media.local_read': { paramsTuple?: []; params?: {} }
    'projects.clients': { paramsTuple?: []; params?: {} }
    'auth.me.show': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.read.facebook.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.read.facebook.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.manage.facebook.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.facebook.manage.facebook.accounts': { paramsTuple?: []; params?: {} }
    'social.pinterest.read.pinterest.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.read.pinterest.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.manage.pinterest.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.pinterest.manage.pinterest.accounts': { paramsTuple?: []; params?: {} }
    'social.tiktok.read.tik_tok.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.read.tik_tok.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.manage.tik_tok.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.tiktok.manage.tik_tok.accounts': { paramsTuple?: []; params?: {} }
    'social.linkedin.read.linked_in.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.read.linked_in.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.manage.linked_in.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.linkedin.manage.linked_in.accounts': { paramsTuple?: []; params?: {} }
    'social.instagram.read.instagram.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.read.instagram.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.manage.instagram.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.instagram.manage.instagram.accounts': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.overview': { paramsTuple?: []; params?: {} }
    'admin.admin_users.index': { paramsTuple?: []; params?: {} }
    'admin.admin_users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.projects': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.project': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.publications': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.publication': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.social_accounts': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.social_account': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.incidents': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.incident': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.audit_logs': { paramsTuple?: []; params?: {} }
    'admin.admin_system.status': { paramsTuple?: []; params?: {} }
    'admin.admin_system.metrics': { paramsTuple?: []; params?: {} }
    'admin.admin_backups.index': { paramsTuple?: []; params?: {} }
    'supervision.supervision.summary': { paramsTuple?: []; params?: {} }
    'supervision.supervision.items': { paramsTuple?: []; params?: {} }
    'statistics.statistics.show': { paramsTuple?: []; params?: {} }
    'statistics.statistics.export': { paramsTuple?: []; params?: {} }
    'calendar.export.calendar_feeds.export': { paramsTuple?: []; params?: {} }
    'calendar.export.calendar_feeds.index': { paramsTuple?: []; params?: {} }
    'ai-generations.ai_generations.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ai-generations.ai_generations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.read.network_variants.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.read.network_variants.effective': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'network': ParamValue} }
    'translations.read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projects.projects.index': { paramsTuple?: []; params?: {} }
    'projects.projects.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'calendar.index': { paramsTuple?: []; params?: {} }
    'publications.index': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'publications.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'discussion.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.read_url': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'annotations.index': { paramsTuple: [ParamValue,ParamValue]; params: {'publicationId': ParamValue,'mediaId': ParamValue} }
    'notifications.notifications.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'health.live': { paramsTuple?: []; params?: {} }
    'health.ready': { paramsTuple?: []; params?: {} }
    'docs.ui': { paramsTuple?: []; params?: {} }
    'docs.spec': { paramsTuple?: []; params?: {} }
    'auth.csrf': { paramsTuple?: []; params?: {} }
    'calendar.feed.public': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'media.local_read': { paramsTuple?: []; params?: {} }
    'projects.clients': { paramsTuple?: []; params?: {} }
    'auth.me.show': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.read.facebook.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.read.facebook.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.manage.facebook.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.facebook.manage.facebook.accounts': { paramsTuple?: []; params?: {} }
    'social.pinterest.read.pinterest.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.read.pinterest.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.manage.pinterest.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.pinterest.manage.pinterest.accounts': { paramsTuple?: []; params?: {} }
    'social.tiktok.read.tik_tok.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.read.tik_tok.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.manage.tik_tok.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.tiktok.manage.tik_tok.accounts': { paramsTuple?: []; params?: {} }
    'social.linkedin.read.linked_in.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.read.linked_in.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.manage.linked_in.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.linkedin.manage.linked_in.accounts': { paramsTuple?: []; params?: {} }
    'social.instagram.read.instagram.publication_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.read.instagram.schedule_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.manage.instagram.oauth_callback': { paramsTuple?: []; params?: {} }
    'social.instagram.manage.instagram.accounts': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.overview': { paramsTuple?: []; params?: {} }
    'admin.admin_users.index': { paramsTuple?: []; params?: {} }
    'admin.admin_users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.projects': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.project': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.publications': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.publication': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.social_accounts': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.social_account': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.incidents': { paramsTuple?: []; params?: {} }
    'admin.admin_resources.incident': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.audit_logs': { paramsTuple?: []; params?: {} }
    'admin.admin_system.status': { paramsTuple?: []; params?: {} }
    'admin.admin_system.metrics': { paramsTuple?: []; params?: {} }
    'admin.admin_backups.index': { paramsTuple?: []; params?: {} }
    'supervision.supervision.summary': { paramsTuple?: []; params?: {} }
    'supervision.supervision.items': { paramsTuple?: []; params?: {} }
    'statistics.statistics.show': { paramsTuple?: []; params?: {} }
    'statistics.statistics.export': { paramsTuple?: []; params?: {} }
    'calendar.export.calendar_feeds.export': { paramsTuple?: []; params?: {} }
    'calendar.export.calendar_feeds.index': { paramsTuple?: []; params?: {} }
    'ai-generations.ai_generations.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ai-generations.ai_generations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.read.network_variants.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.read.network_variants.effective': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'network': ParamValue} }
    'translations.read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projects.projects.index': { paramsTuple?: []; params?: {} }
    'projects.projects.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'calendar.index': { paramsTuple?: []; params?: {} }
    'publications.index': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'publications.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'discussion.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.read_url': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'annotations.index': { paramsTuple: [ParamValue,ParamValue]; params: {'publicationId': ParamValue,'mediaId': ParamValue} }
    'notifications.notifications.index': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'media.local_upload': { paramsTuple?: []; params?: {} }
    'translations.manage.translations.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'locale': ParamValue} }
  }
  POST: {
    'auth.register.store': { paramsTuple?: []; params?: {} }
    'auth.session.store': { paramsTuple?: []; params?: {} }
    'auth.session.destroy': { paramsTuple?: []; params?: {} }
    'social.facebook.manage.facebook.oauth_start': { paramsTuple?: []; params?: {} }
    'social.facebook.manage.facebook.validate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.manage.facebook.schedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.facebook.manage.facebook.retry': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.manage.pinterest.oauth_start': { paramsTuple?: []; params?: {} }
    'social.pinterest.manage.pinterest.refresh': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.manage.pinterest.validate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.manage.pinterest.schedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.manage.pinterest.retry': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.manage.tik_tok.oauth_start': { paramsTuple?: []; params?: {} }
    'social.tiktok.manage.tik_tok.refresh': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.manage.tik_tok.validate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.manage.tik_tok.schedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.manage.tik_tok.retry': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.manage.linked_in.oauth_start': { paramsTuple?: []; params?: {} }
    'social.linkedin.manage.linked_in.refresh': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.manage.linked_in.validate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.manage.linked_in.schedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.manage.linked_in.retry': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.manage.instagram.oauth_start': { paramsTuple?: []; params?: {} }
    'social.instagram.manage.instagram.validate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.manage.instagram.schedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.manage.instagram.retry': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.archive_project': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.restore_project': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.archive_publication': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_resources.restore_publication': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_system.retry': { paramsTuple: [ParamValue]; params: {'jobId': ParamValue} }
    'calendar.export.calendar_feeds.store': { paramsTuple?: []; params?: {} }
    'ai-generations.ai_generations.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ai-generations.ai_generations.apply': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ai-generations.ai_generations.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'translations.manage.translations.generate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'translations.manage.translations.approve': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'locale': ParamValue} }
    'network-variants.approve': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.manage.network_variants.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.manage.network_variants.generate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.manage.network_variants.stale': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projects.manage.projects.store': { paramsTuple?: []; params?: {} }
    'projects.manage.projects.restore': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'comments.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reviews.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'annotations.store': { paramsTuple: [ParamValue,ParamValue]; params: {'publicationId': ParamValue,'mediaId': ParamValue} }
    'publications.store': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'publications.duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'publications.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'publications.transition': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'calendar.move': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.initialize': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.finalize': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.attach': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.purge': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'users.locale': { paramsTuple?: []; params?: {} }
    'admin.admin_users.update_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_users.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'supervision.supervision.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'network-variants.manage.network_variants.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projects.manage.projects.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'comments.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'annotations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.notifications.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'publications.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.reorder': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'social.facebook.manage.facebook.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.pinterest.manage.pinterest.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.tiktok.manage.tik_tok.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.linkedin.manage.linked_in.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'social.instagram.manage.instagram.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'calendar.export.calendar_feeds.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projects.manage.projects.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'comments.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'annotations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.detach': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'mediaId': ParamValue} }
    'media.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}