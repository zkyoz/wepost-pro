import { redactSensitive } from '#domain/admin/admin_guards'
import { archiveProject, restoreProject } from '#domain/projects/project_status'
import type { PublicationStatus } from '#domain/publications/publication_lifecycle'
import AuditLog from '#models/audit_log'
import Project from '#models/project'
import Publication from '#models/publication'
import PublicationAttempt from '#models/publication_attempt'
import ScheduledPublication from '#models/scheduled_publication'
import SocialAccount from '#models/social_account'
import { recordAdminAction } from '#services/admin/admin_metrics'
import { toProjectViews } from '#services/projects/project_service'
import { toPublicationView } from '#services/publications/publication_service'
import {
  adminAuditValidator,
  adminIdValidator,
  adminIncidentsValidator,
  adminProjectsValidator,
  adminPublicationsValidator,
  adminSocialAccountsValidator,
} from '#validators/admin/resource_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const notFound = { errors: [{ message: 'Ressource introuvable.' }] }
const restorablePublicationStatuses: readonly PublicationStatus[] = [
  'draft',
  'in_progress',
  'awaiting_client_review',
  'changes_requested',
  'approved',
  'scheduled',
  'published',
  'failed',
]

function numberFromAggregate(row: Record<string, unknown> | undefined) {
  return Number(row?.total ?? 0)
}

function paginationMeta(total: number, page: number, perPage: number) {
  return {
    total,
    perPage,
    currentPage: page,
    lastPage: Math.max(1, Math.ceil(total / perPage)),
    firstPage: 1,
    firstPageUrl: null,
    lastPageUrl: null,
    nextPageUrl: null,
    previousPageUrl: null,
  }
}

function socialAccountView(account: SocialAccount) {
  const reference = account.externalAccountId
  return {
    id: account.id,
    agencyId: account.agencyId,
    network: account.network,
    externalAccountName: account.externalAccountName,
    externalAccountReference:
      reference.length > 4 ? `••••${reference.slice(-4)}` : 'Identifiant masqué',
    scopes: account.scopes,
    status: account.status,
    expiresAt: account.expiresAt?.toUTC().toISO() ?? null,
    createdAt: account.createdAt.toUTC().toISO()!,
    updatedAt: account.updatedAt.toUTC().toISO()!,
    revokedAt: account.revokedAt?.toUTC().toISO() ?? null,
  }
}

async function incidentViews(attempts: readonly PublicationAttempt[]) {
  const scheduleIds = [...new Set(attempts.map((attempt) => attempt.scheduledId))]
  const schedules = scheduleIds.length
    ? await ScheduledPublication.query().whereIn('id', scheduleIds)
    : []
  const scheduleById = new Map(schedules.map((schedule) => [schedule.id, schedule]))
  const publicationIds = [...new Set(schedules.map((schedule) => schedule.publicationId))]
  const publications = publicationIds.length
    ? await Publication.query().whereIn('id', publicationIds)
    : []
  const publicationById = new Map(publications.map((publication) => [publication.id, publication]))

  return attempts.map((attempt) => {
    const schedule = scheduleById.get(attempt.scheduledId)
    const publication = schedule ? publicationById.get(schedule.publicationId) : undefined
    return {
      id: attempt.id,
      scheduledId: attempt.scheduledId,
      publicationId: publication?.id ?? null,
      publicationTitle: publication?.title ?? 'Publication indisponible',
      network: schedule?.network ?? null,
      scheduleStatus: schedule?.status ?? null,
      attempt: attempt.attempt,
      result: attempt.result,
      error: redactSensitive(attempt.normalizedError),
      remotePostReference: attempt.remotePostId ? 'Identifiant distant enregistré' : null,
      startedAt: attempt.startedAt.toUTC().toISO()!,
      finishedAt: attempt.finishedAt?.toUTC().toISO() ?? null,
    }
  })
}

export default class AdminResourcesController {
  async overview({ response }: HttpContext) {
    const [users, activeUsers, projects, archivedProjects, publications, accounts, incidents] =
      await Promise.all([
        db.from('users').count('* as total').first(),
        db.from('users').where('is_active', true).count('* as total').first(),
        db.from('projects').count('* as total').first(),
        db.from('projects').where('status', 'archived').count('* as total').first(),
        db.from('publications').count('* as total').first(),
        db.from('social_accounts').whereNot('status', 'revoked').count('* as total').first(),
        db
          .from('publication_attempts')
          .whereIn('result', ['transient_failure', 'permanent_failure'])
          .count('* as total')
          .first(),
      ])
    return response.ok({
      data: {
        users: { total: numberFromAggregate(users), active: numberFromAggregate(activeUsers) },
        projects: {
          total: numberFromAggregate(projects),
          archived: numberFromAggregate(archivedProjects),
        },
        publications: { total: numberFromAggregate(publications) },
        socialAccounts: { active: numberFromAggregate(accounts) },
        incidents: { total: numberFromAggregate(incidents) },
      },
    })
  }

  async projects({ request, response }: HttpContext) {
    const {
      page = 1,
      perPage = 20,
      q,
      status,
    } = await request.validateUsing(adminProjectsValidator)
    const query = Project.query()
    if (q) query.whereILike('name', `%${q}%`)
    if (status) query.where('status', status)
    const paginator = await query.orderBy('updatedAt', 'desc').paginate(page, perPage)
    return response.ok({
      data: await toProjectViews(paginator.all()),
      meta: paginator.getMeta(),
    })
  }

  async project({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(adminIdValidator)
    const project = await Project.find(params.id)
    if (!project) return response.notFound(notFound)
    const [view] = await toProjectViews([project])
    return response.ok({ data: view })
  }

  async archiveProject(context: HttpContext) {
    return this.changeProjectState(context, true)
  }

  async restoreProject(context: HttpContext) {
    return this.changeProjectState(context, false)
  }

  private async changeProjectState(
    { auth, logger, request, response }: HttpContext,
    archived: boolean
  ) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(adminIdValidator)
    const project = await Project.find(params.id)
    if (!project) return response.notFound(notFound)
    const transition = archived ? archiveProject(project.status) : restoreProject(project.status)
    if (transition.changed) {
      await db.transaction(async (trx) => {
        project.useTransaction(trx)
        const previous = project.status
        project.status = transition.status
        project.archivedAt = archived ? DateTime.utc() : null
        await project.save()
        await AuditLog.create(
          {
            actorUserId: actor.id,
            targetProjectId: project.id,
            action: archived ? 'project.archived' : 'project.restored',
            previousValues: { status: previous },
            nextValues: { status: transition.status },
          },
          { client: trx }
        )
      })
      const action = archived ? 'project.archived' : 'project.restored'
      logger.info({
        event: 'admin.action',
        action,
        actorId: actor.id,
        targetId: project.id,
        metric: 'admin_action_total',
        metricValue: recordAdminAction(action),
      })
    }
    const [view] = await toProjectViews([project])
    return response.ok({ data: view })
  }

  async publications({ request, response }: HttpContext) {
    const {
      page = 1,
      perPage = 20,
      q,
      status,
    } = await request.validateUsing(adminPublicationsValidator)
    const query = Publication.query()
    if (q) query.whereILike('title', `%${q}%`)
    if (status) query.where('status', status)
    const paginator = await query.orderBy('updatedAt', 'desc').paginate(page, perPage)
    return response.ok({
      data: paginator.all().map((publication) => toPublicationView(publication)),
      meta: paginator.getMeta(),
    })
  }

  async publication({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(adminIdValidator)
    const publication = await Publication.find(params.id)
    if (!publication) return response.notFound(notFound)
    return response.ok({ data: toPublicationView(publication) })
  }

  async archivePublication(context: HttpContext) {
    return this.changePublicationState(context, true)
  }

  async restorePublication(context: HttpContext) {
    return this.changePublicationState(context, false)
  }

  private async changePublicationState(
    { auth, logger, request, response }: HttpContext,
    archived: boolean
  ) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(adminIdValidator)
    const publication = await Publication.find(params.id)
    if (!publication) return response.notFound(notFound)
    if (archived && publication.status === 'publishing') {
      return response.conflict({
        errors: [{ message: 'Une publication en cours d’envoi ne peut pas être archivée.' }],
      })
    }
    if (archived && publication.status !== 'archived') {
      const previousStatus = publication.status
      await db.transaction(async (trx) => {
        publication.useTransaction(trx)
        publication.status = 'archived'
        publication.archivedAt = DateTime.utc()
        publication.updatedBy = actor.id
        await publication.save()
        await AuditLog.create(
          {
            actorUserId: actor.id,
            targetProjectId: publication.projectId,
            targetPublicationId: publication.id,
            action: 'publication.archived',
            previousValues: { status: previousStatus },
            nextValues: { status: 'archived' },
          },
          { client: trx }
        )
      })
    } else if (!archived && publication.status === 'archived') {
      const archiveEntry = await AuditLog.query()
        .where('targetPublicationId', publication.id)
        .where('action', 'publication.archived')
        .orderBy('createdAt', 'desc')
        .first()
      const previousStatus = archiveEntry?.previousValues.status
      if (
        typeof previousStatus !== 'string' ||
        !restorablePublicationStatuses.includes(previousStatus as PublicationStatus)
      ) {
        return response.conflict({
          errors: [{ message: 'Le statut antérieur ne permet pas une restauration sûre.' }],
        })
      }
      await db.transaction(async (trx) => {
        publication.useTransaction(trx)
        publication.status = previousStatus as PublicationStatus
        publication.archivedAt = null
        publication.updatedBy = actor.id
        await publication.save()
        await AuditLog.create(
          {
            actorUserId: actor.id,
            targetProjectId: publication.projectId,
            targetPublicationId: publication.id,
            action: 'publication.restored',
            previousValues: { status: 'archived' },
            nextValues: { status: previousStatus },
          },
          { client: trx }
        )
      })
    } else {
      return response.ok({ data: toPublicationView(publication) })
    }

    const action = archived ? 'publication.archived' : 'publication.restored'
    logger.info({
      event: 'admin.action',
      action,
      actorId: actor.id,
      targetId: publication.id,
      metric: 'admin_action_total',
      metricValue: recordAdminAction(action),
    })
    return response.ok({ data: toPublicationView(publication) })
  }

  async socialAccounts({ request, response }: HttpContext) {
    const {
      page = 1,
      perPage = 20,
      q,
      network,
      status,
    } = await request.validateUsing(adminSocialAccountsValidator)
    const query = SocialAccount.query()
    if (q) query.whereILike('externalAccountName', `%${q}%`)
    if (network) query.where('network', network)
    if (status) query.where('status', status)
    const paginator = await query.orderBy('updatedAt', 'desc').paginate(page, perPage)
    return response.ok({
      data: paginator.all().map(socialAccountView),
      meta: paginator.getMeta(),
    })
  }

  async socialAccount({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(adminIdValidator)
    const account = await SocialAccount.find(params.id)
    if (!account) return response.notFound(notFound)
    return response.ok({ data: socialAccountView(account) })
  }

  async incidents({ request, response }: HttpContext) {
    const {
      page = 1,
      perPage = 20,
      q,
      result,
    } = await request.validateUsing(adminIncidentsValidator)
    const query = PublicationAttempt.query()
    if (q) query.whereRaw("COALESCE(normalized_error::text, '') ILIKE ?", [`%${q}%`])
    if (result) query.where('result', result)
    else query.whereIn('result', ['transient_failure', 'permanent_failure'])
    const paginator = await query.orderBy('startedAt', 'desc').paginate(page, perPage)
    return response.ok({
      data: await incidentViews(paginator.all()),
      meta: paginator.getMeta(),
    })
  }

  async incident({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(adminIdValidator)
    const incident = await PublicationAttempt.find(params.id)
    if (!incident) return response.notFound(notFound)
    const [view] = await incidentViews([incident])
    return response.ok({ data: view })
  }

  async auditLogs({ request, response }: HttpContext) {
    const {
      page = 1,
      perPage = 20,
      q,
      action,
      entityType,
    } = await request.validateUsing(adminAuditValidator)
    const filters = (query: ReturnType<typeof db.from>) => {
      if (q) query.whereILike('audit_logs.action', `%${q}%`)
      if (action) query.where('audit_logs.action', action)
      if (entityType) query.where('audit_logs.entity_type', entityType)
      return query
    }
    const totalRow = await filters(db.from('audit_logs')).count('* as total').first()
    const total = numberFromAggregate(totalRow)
    const rows = await filters(
      db
        .from('audit_logs')
        .leftJoin('users as actors', 'actors.id', 'audit_logs.actor_user_id')
        .select(
          'audit_logs.id',
          'audit_logs.actor_user_id',
          'actors.display_name as actor_name',
          'audit_logs.action',
          'audit_logs.entity_type',
          'audit_logs.entity_id',
          'audit_logs.previous_values',
          'audit_logs.next_values',
          'audit_logs.metadata_json',
          'audit_logs.created_at'
        )
    )
      .orderBy('audit_logs.created_at', 'desc')
      .limit(perPage)
      .offset((page - 1) * perPage)

    return response.ok({
      data: rows.map((row) => ({
        id: row.id,
        actorUserId: row.actor_user_id,
        actorName: row.actor_name ?? 'Système',
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        previousValues: redactSensitive(row.previous_values),
        nextValues: redactSensitive(row.next_values),
        metadata: redactSensitive(row.metadata_json),
        createdAt: DateTime.fromJSDate(row.created_at).toUTC().toISO(),
      })),
      meta: paginationMeta(total, page, perPage),
    })
  }
}
