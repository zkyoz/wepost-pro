import app from '@adonisjs/core/services/app'
import env from '#start/env'
import type { PublicationStatus, SocialNetwork } from '#domain/publications/publication_lifecycle'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'

const password = 'Demo-Wepost-2026!'
const agencyId = '10000000-0000-4000-8000-000000000001'
const userIds = {
  admin: '10000000-0000-4000-8000-000000000011',
  agency: '10000000-0000-4000-8000-000000000012',
  client: '10000000-0000-4000-8000-000000000013',
}
const projectId = '20000000-0000-4000-8000-000000000001'

type DemoPublication = {
  id: string
  title: string
  baseText: string
  status: PublicationStatus
  targetNetworks: SocialNetwork[]
  scheduledInDays: number
  approvedVersion: number | null
}

const demoPublications: DemoPublication[] = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    title: 'Campagne été responsable',
    baseText:
      'Cet été, découvrons des idées simples pour communiquer avec créativité tout en limitant notre impact.',
    status: 'awaiting_client_review' as const,
    targetNetworks: ['facebook', 'instagram', 'linkedin'],
    scheduledInDays: 2,
    approvedVersion: null,
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    title: 'Annonce de la rentrée',
    baseText:
      'La rentrée se prépare : nouveaux projets, même exigence de qualité et une collaboration toujours plus fluide.',
    status: 'approved' as const,
    targetNetworks: ['linkedin', 'facebook'],
    scheduledInDays: 5,
    approvedVersion: 1,
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    title: 'Conseil éditorial de la semaine',
    baseText:
      'Un bon calendrier éditorial commence par un objectif clair, une audience précise et un rythme réaliste.',
    status: 'scheduled' as const,
    targetNetworks: ['linkedin'],
    scheduledInDays: 7,
    approvedVersion: 1,
  },
  {
    id: '30000000-0000-4000-8000-000000000004',
    title: 'Retour client à intégrer',
    baseText:
      'Une première proposition volontairement perfectible pour tester le cycle de correction avec le client.',
    status: 'changes_requested' as const,
    targetNetworks: ['instagram', 'pinterest'],
    scheduledInDays: 10,
    approvedVersion: null,
  },
]

export default class SeedDemo extends BaseCommand {
  static commandName = 'dev:seed-demo'
  static description = 'Seed safe local accounts and representative Wepost demo content'
  static options: CommandOptions = { startApp: true }

  async run() {
    const databaseHost = env.get('DB_HOST')
    if (app.inProduction || !['127.0.0.1', 'localhost'].includes(databaseHost)) {
      this.logger.error('Refusing to seed demo data outside a local development database')
      this.exitCode = 1
      return
    }

    const [
      { default: User },
      { default: Project },
      { default: ProjectMember },
      { default: Publication },
      { default: PublicationVersion },
      { default: Comment },
      { default: PublicationReview },
      { default: Notification },
    ] = await Promise.all([
      import('#models/user'),
      import('#models/project'),
      import('#models/project_member'),
      import('#models/publication'),
      import('#models/publication_version'),
      import('#models/comment'),
      import('#models/publication_review'),
      import('#models/notification'),
    ])

    await Promise.all([
      User.updateOrCreate(
        { id: userIds.admin },
        {
          displayName: 'Admin Démo',
          email: 'admin@wepost.local',
          password,
          role: 'admin',
          agencyId: null,
          locale: 'fr',
          isActive: true,
        }
      ),
      User.updateOrCreate(
        { id: userIds.agency },
        {
          displayName: 'Agence Démo',
          email: 'agence@wepost.local',
          password,
          role: 'agency',
          agencyId,
          locale: 'fr',
          isActive: true,
        }
      ),
      User.updateOrCreate(
        { id: userIds.client },
        {
          displayName: 'Client Démo',
          email: 'client@wepost.local',
          password,
          role: 'client',
          agencyId,
          locale: 'fr',
          isActive: true,
        }
      ),
    ])

    await Project.firstOrCreate(
      { id: projectId },
      {
        agencyId,
        name: 'Maison Azur — Démonstration',
        description:
          'Projet local prérempli pour parcourir les rôles, publications, validations, calendrier et statistiques.',
        status: 'active',
        clientUserId: userIds.client,
        timezone: 'Europe/Paris',
        createdBy: userIds.agency,
        archivedAt: null,
      }
    )
    await ProjectMember.updateOrCreate(
      { projectId, userId: userIds.client },
      { membershipRole: 'primary' }
    )

    const now = DateTime.now().setZone('Europe/Paris')
    for (const item of demoPublications) {
      const scheduledAt = now
        .plus({ days: item.scheduledInDays })
        .startOf('day')
        .plus({ hours: 10 })
        .toUTC()
      const publication = await Publication.firstOrCreate(
        { id: item.id },
        {
          agencyId,
          projectId,
          title: item.title,
          baseText: item.baseText,
          status: item.status,
          targetNetworks: item.targetNetworks,
          scheduledAt,
          timezone: 'Europe/Paris',
          contentVersion: 1,
          approvedVersion: item.approvedVersion,
          createdBy: userIds.agency,
          updatedBy: userIds.agency,
          archivedAt: null,
        }
      )
      await PublicationVersion.firstOrCreate(
        { publicationId: publication.id, version: 1 },
        {
          snapshotJson: {
            title: publication.title,
            baseText: publication.baseText,
            status: publication.status,
            targetNetworks: publication.targetNetworks,
            scheduledAt: publication.scheduledAt?.toUTC().toISO() ?? null,
            timezone: publication.timezone,
          },
          authorId: userIds.agency,
        }
      )
    }

    await Comment.firstOrCreate(
      { id: '40000000-0000-4000-8000-000000000001' },
      {
        publicationId: demoPublications[3].id,
        authorId: userIds.client,
        body: 'Pouvez-vous rendre l’introduction plus concrète et ajouter un appel à l’action ?',
        editedAt: null,
        deletedAt: null,
      }
    )
    await PublicationReview.firstOrCreate(
      { id: '50000000-0000-4000-8000-000000000001' },
      {
        publicationId: demoPublications[3].id,
        reviewerId: userIds.client,
        version: 1,
        decision: 'changes_requested',
        message: 'Merci de préciser le bénéfice client dans la conclusion.',
      }
    )
    await Notification.firstOrCreate(
      { id: '60000000-0000-4000-8000-000000000001' },
      {
        userId: userIds.agency,
        type: 'publication.review_changes_requested',
        payloadJson: { publicationId: demoPublications[3].id, projectId },
        readAt: null,
        emailStatus: 'pending',
        emailJobId: null,
        emailAttempts: 0,
        emailLastError: null,
        emailedAt: null,
      }
    )

    this.logger.success('Local demo data is ready')
    this.logger.info(`Admin: admin@wepost.local / ${password}`)
    this.logger.info(`Agence: agence@wepost.local / ${password}`)
    this.logger.info(`Client: client@wepost.local / ${password}`)
  }
}
