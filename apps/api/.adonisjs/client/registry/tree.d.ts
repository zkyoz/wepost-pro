/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  health: {
    live: typeof routes['health.live']
    ready: typeof routes['health.ready']
  }
  docs: {
    ui: typeof routes['docs.ui']
    spec: typeof routes['docs.spec']
  }
  auth: {
    csrf: typeof routes['auth.csrf']
    register: {
      store: typeof routes['auth.register.store']
    }
    session: {
      store: typeof routes['auth.session.store']
      destroy: typeof routes['auth.session.destroy']
    }
    me: {
      show: typeof routes['auth.me.show']
    }
  }
  calendar: {
    feed: {
      public: typeof routes['calendar.feed.public']
    }
    export: {
      calendarFeeds: {
        export: typeof routes['calendar.export.calendar_feeds.export']
        index: typeof routes['calendar.export.calendar_feeds.index']
        store: typeof routes['calendar.export.calendar_feeds.store']
        destroy: typeof routes['calendar.export.calendar_feeds.destroy']
      }
    }
    index: typeof routes['calendar.index']
    move: typeof routes['calendar.move']
  }
  media: {
    localUpload: typeof routes['media.local_upload']
    localRead: typeof routes['media.local_read']
    index: typeof routes['media.index']
    readUrl: typeof routes['media.read_url']
    initialize: typeof routes['media.initialize']
    finalize: typeof routes['media.finalize']
    attach: typeof routes['media.attach']
    update: typeof routes['media.update']
    reorder: typeof routes['media.reorder']
    detach: typeof routes['media.detach']
    destroy: typeof routes['media.destroy']
    purge: typeof routes['media.purge']
  }
  projects: {
    clients: typeof routes['projects.clients']
    projects: {
      index: typeof routes['projects.projects.index']
      show: typeof routes['projects.projects.show']
    }
    manage: {
      projects: {
        store: typeof routes['projects.manage.projects.store']
        update: typeof routes['projects.manage.projects.update']
        archive: typeof routes['projects.manage.projects.archive']
        restore: typeof routes['projects.manage.projects.restore']
      }
    }
  }
  users: {
    show: typeof routes['users.show']
    locale: typeof routes['users.locale']
  }
  social: {
    facebook: {
      read: {
        facebook: {
          publicationStatus: typeof routes['social.facebook.read.facebook.publication_status']
          scheduleStatus: typeof routes['social.facebook.read.facebook.schedule_status']
        }
      }
      manage: {
        facebook: {
          oauthStart: typeof routes['social.facebook.manage.facebook.oauth_start']
          oauthCallback: typeof routes['social.facebook.manage.facebook.oauth_callback']
          accounts: typeof routes['social.facebook.manage.facebook.accounts']
          revoke: typeof routes['social.facebook.manage.facebook.revoke']
          validate: typeof routes['social.facebook.manage.facebook.validate']
          schedule: typeof routes['social.facebook.manage.facebook.schedule']
          retry: typeof routes['social.facebook.manage.facebook.retry']
        }
      }
    }
    pinterest: {
      read: {
        pinterest: {
          publicationStatus: typeof routes['social.pinterest.read.pinterest.publication_status']
          scheduleStatus: typeof routes['social.pinterest.read.pinterest.schedule_status']
        }
      }
      manage: {
        pinterest: {
          oauthStart: typeof routes['social.pinterest.manage.pinterest.oauth_start']
          oauthCallback: typeof routes['social.pinterest.manage.pinterest.oauth_callback']
          accounts: typeof routes['social.pinterest.manage.pinterest.accounts']
          refresh: typeof routes['social.pinterest.manage.pinterest.refresh']
          revoke: typeof routes['social.pinterest.manage.pinterest.revoke']
          validate: typeof routes['social.pinterest.manage.pinterest.validate']
          schedule: typeof routes['social.pinterest.manage.pinterest.schedule']
          retry: typeof routes['social.pinterest.manage.pinterest.retry']
        }
      }
    }
    tiktok: {
      read: {
        tikTok: {
          publicationStatus: typeof routes['social.tiktok.read.tik_tok.publication_status']
          scheduleStatus: typeof routes['social.tiktok.read.tik_tok.schedule_status']
        }
      }
      manage: {
        tikTok: {
          oauthStart: typeof routes['social.tiktok.manage.tik_tok.oauth_start']
          oauthCallback: typeof routes['social.tiktok.manage.tik_tok.oauth_callback']
          accounts: typeof routes['social.tiktok.manage.tik_tok.accounts']
          refresh: typeof routes['social.tiktok.manage.tik_tok.refresh']
          revoke: typeof routes['social.tiktok.manage.tik_tok.revoke']
          validate: typeof routes['social.tiktok.manage.tik_tok.validate']
          schedule: typeof routes['social.tiktok.manage.tik_tok.schedule']
          retry: typeof routes['social.tiktok.manage.tik_tok.retry']
        }
      }
    }
    linkedin: {
      read: {
        linkedIn: {
          publicationStatus: typeof routes['social.linkedin.read.linked_in.publication_status']
          scheduleStatus: typeof routes['social.linkedin.read.linked_in.schedule_status']
        }
      }
      manage: {
        linkedIn: {
          oauthStart: typeof routes['social.linkedin.manage.linked_in.oauth_start']
          oauthCallback: typeof routes['social.linkedin.manage.linked_in.oauth_callback']
          accounts: typeof routes['social.linkedin.manage.linked_in.accounts']
          refresh: typeof routes['social.linkedin.manage.linked_in.refresh']
          revoke: typeof routes['social.linkedin.manage.linked_in.revoke']
          validate: typeof routes['social.linkedin.manage.linked_in.validate']
          schedule: typeof routes['social.linkedin.manage.linked_in.schedule']
          retry: typeof routes['social.linkedin.manage.linked_in.retry']
        }
      }
    }
    instagram: {
      read: {
        instagram: {
          publicationStatus: typeof routes['social.instagram.read.instagram.publication_status']
          scheduleStatus: typeof routes['social.instagram.read.instagram.schedule_status']
        }
      }
      manage: {
        instagram: {
          oauthStart: typeof routes['social.instagram.manage.instagram.oauth_start']
          oauthCallback: typeof routes['social.instagram.manage.instagram.oauth_callback']
          accounts: typeof routes['social.instagram.manage.instagram.accounts']
          revoke: typeof routes['social.instagram.manage.instagram.revoke']
          validate: typeof routes['social.instagram.manage.instagram.validate']
          schedule: typeof routes['social.instagram.manage.instagram.schedule']
          retry: typeof routes['social.instagram.manage.instagram.retry']
        }
      }
    }
  }
  admin: {
    adminResources: {
      overview: typeof routes['admin.admin_resources.overview']
      projects: typeof routes['admin.admin_resources.projects']
      project: typeof routes['admin.admin_resources.project']
      archiveProject: typeof routes['admin.admin_resources.archive_project']
      restoreProject: typeof routes['admin.admin_resources.restore_project']
      publications: typeof routes['admin.admin_resources.publications']
      publication: typeof routes['admin.admin_resources.publication']
      archivePublication: typeof routes['admin.admin_resources.archive_publication']
      restorePublication: typeof routes['admin.admin_resources.restore_publication']
      socialAccounts: typeof routes['admin.admin_resources.social_accounts']
      socialAccount: typeof routes['admin.admin_resources.social_account']
      incidents: typeof routes['admin.admin_resources.incidents']
      incident: typeof routes['admin.admin_resources.incident']
      auditLogs: typeof routes['admin.admin_resources.audit_logs']
    }
    adminUsers: {
      index: typeof routes['admin.admin_users.index']
      show: typeof routes['admin.admin_users.show']
      updateRole: typeof routes['admin.admin_users.update_role']
      updateStatus: typeof routes['admin.admin_users.update_status']
    }
    adminSystem: {
      status: typeof routes['admin.admin_system.status']
      metrics: typeof routes['admin.admin_system.metrics']
      retry: typeof routes['admin.admin_system.retry']
    }
    adminBackups: {
      index: typeof routes['admin.admin_backups.index']
    }
  }
  supervision: {
    supervision: {
      summary: typeof routes['supervision.supervision.summary']
      items: typeof routes['supervision.supervision.items']
      markRead: typeof routes['supervision.supervision.mark_read']
    }
  }
  statistics: {
    statistics: {
      show: typeof routes['statistics.statistics.show']
      export: typeof routes['statistics.statistics.export']
    }
  }
  aiGenerations: {
    aiGenerations: {
      index: typeof routes['ai-generations.ai_generations.index']
      store: typeof routes['ai-generations.ai_generations.store']
      show: typeof routes['ai-generations.ai_generations.show']
      apply: typeof routes['ai-generations.ai_generations.apply']
      cancel: typeof routes['ai-generations.ai_generations.cancel']
    }
  }
  networkVariants: {
    read: {
      networkVariants: {
        index: typeof routes['network-variants.read.network_variants.index']
        effective: typeof routes['network-variants.read.network_variants.effective']
      }
    }
    approve: typeof routes['network-variants.approve']
    manage: {
      networkVariants: {
        store: typeof routes['network-variants.manage.network_variants.store']
        generate: typeof routes['network-variants.manage.network_variants.generate']
        update: typeof routes['network-variants.manage.network_variants.update']
        stale: typeof routes['network-variants.manage.network_variants.stale']
      }
    }
  }
  translations: {
    read: typeof routes['translations.read']
    manage: {
      translations: {
        generate: typeof routes['translations.manage.translations.generate']
        update: typeof routes['translations.manage.translations.update']
        approve: typeof routes['translations.manage.translations.approve']
      }
    }
  }
  publications: {
    index: typeof routes['publications.index']
    show: typeof routes['publications.show']
    store: typeof routes['publications.store']
    update: typeof routes['publications.update']
    duplicate: typeof routes['publications.duplicate']
    archive: typeof routes['publications.archive']
    transition: typeof routes['publications.transition']
  }
  discussion: {
    show: typeof routes['discussion.show']
  }
  annotations: {
    index: typeof routes['annotations.index']
    store: typeof routes['annotations.store']
    update: typeof routes['annotations.update']
    destroy: typeof routes['annotations.destroy']
  }
  comments: {
    store: typeof routes['comments.store']
    update: typeof routes['comments.update']
    destroy: typeof routes['comments.destroy']
  }
  reviews: {
    store: typeof routes['reviews.store']
  }
  notifications: {
    notifications: {
      index: typeof routes['notifications.notifications.index']
      update: typeof routes['notifications.notifications.update']
    }
  }
}
