import {
  applyContentChange,
  assertCurrentVersion,
  canEditPublication,
  PublicationVersionConflictError,
  transitionPublication,
} from '#domain/publications/publication_lifecycle'
import { canAcceptPublications } from '#domain/projects/project_status'
import AuditLog from '#models/audit_log'
import Publication from '#models/publication'
import PublicationVersion from '#models/publication_version'
import {
  findAccessiblePublication,
  publicationSnapshot,
  toPublicationView,
} from '#services/publications/publication_service'
import { markNetworkVariantsStale } from '#services/publications/network_variant_service'
import { markPublicationTranslationsStale } from '#services/i18n/translation_service'
import { findAccessibleProject, isValidTimezone } from '#services/projects/project_service'
import {
  createPublicationValidator,
  listPublicationsValidator,
  showPublicationValidator,
  transitionPublicationValidator,
  updatePublicationValidator,
} from '#validators/publication_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const notFound = { errors: [{ message: 'Publication introuvable.' }] }
const projectNotFound = { errors: [{ message: 'Projet introuvable.' }] }

function parseScheduledAt(value: string | null | undefined, timezone: string) {
  if (!value) return { value: null, valid: true }
  const date = DateTime.fromISO(value, { zone: timezone })
  return { value: date.isValid ? date.toUTC() : null, valid: date.isValid }
}

function conflict(error: PublicationVersionConflictError) {
  return {
    errors: [{ message: error.message }],
    meta: { currentVersion: error.currentVersion },
  }
}

export default class PublicationsController {
  async index({ auth, logger, request, response }: HttpContext) {
    const startedAt = performance.now()
    const actor = auth.getUserOrFail()
    const {
      params,
      page = 1,
      perPage = 12,
      q,
      status,
      network,
    } = await request.validateUsing(listPublicationsValidator)
    const project = await findAccessibleProject(actor, params.projectId)
    if (!project) return response.notFound(projectNotFound)

    const query = Publication.query().where('projectId', project.id)
    if (q) query.whereILike('title', `%${q}%`)
    if (status) query.where('status', status)
    if (network) query.whereRaw('? = ANY(target_networks)', [network])
    const paginator = await query.orderBy('updatedAt', 'desc').paginate(page, perPage)
    logger.info({
      event: 'publications.listed',
      projectId: project.id,
      actorId: actor.id,
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
    })
    return response.ok({
      data: paginator.all().map((publication) => toPublicationView(publication)),
      meta: paginator.getMeta(),
    })
  }

  async store({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createPublicationValidator)
    const project = await findAccessibleProject(actor, payload.params.projectId)
    if (!project) return response.notFound(projectNotFound)
    if (!canAcceptPublications(project.status)) {
      return response.conflict({ errors: [{ message: 'Réactivez le projet avant de publier.' }] })
    }
    if (!isValidTimezone(payload.timezone)) {
      return response.unprocessableEntity({
        errors: [{ field: 'timezone', message: 'Le fuseau horaire est invalide.' }],
      })
    }
    const scheduled = parseScheduledAt(payload.scheduledAt, payload.timezone)
    if (!scheduled.valid) {
      return response.unprocessableEntity({
        errors: [{ field: 'scheduledAt', message: 'La date souhaitée est invalide.' }],
      })
    }

    const publication = await db.transaction(async (trx) => {
      const created = await Publication.create(
        {
          agencyId: project.agencyId,
          projectId: project.id,
          title: payload.title,
          baseText: payload.baseText,
          status: 'draft',
          targetNetworks: payload.targetNetworks,
          scheduledAt: scheduled.value,
          timezone: payload.timezone,
          contentVersion: 1,
          approvedVersion: null,
          createdBy: actor.id,
          updatedBy: actor.id,
          archivedAt: null,
        },
        { client: trx }
      )
      await PublicationVersion.create(
        {
          publicationId: created.id,
          version: 1,
          snapshotJson: publicationSnapshot(created),
          authorId: actor.id,
        },
        { client: trx }
      )
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: project.id,
          targetPublicationId: created.id,
          action: 'publication.created',
          previousValues: {},
          nextValues: { title: created.title, status: created.status, contentVersion: 1 },
        },
        { client: trx }
      )
      return created
    })
    logger.info({ event: 'publication.created', publicationId: publication.id, actorId: actor.id })
    return response.created({ data: toPublicationView(publication) })
  }

  async show({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(showPublicationValidator)
    const publication = await findAccessiblePublication(actor, params.id)
    if (!publication) return response.notFound(notFound)
    const versions = await PublicationVersion.query()
      .where('publicationId', publication.id)
      .orderBy('version', 'desc')
    return response.ok({ data: toPublicationView(publication, versions) })
  }

  async update({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(updatePublicationValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(notFound)
    try {
      assertCurrentVersion(payload.contentVersion, publication.contentVersion)
    } catch (error) {
      if (error instanceof PublicationVersionConflictError)
        return response.conflict(conflict(error))
      throw error
    }
    if (!canEditPublication(publication.status)) {
      return response.conflict({
        errors: [{ message: 'Cette publication ne peut plus être modifiée.' }],
      })
    }
    const timezone = payload.timezone ?? publication.timezone
    if (!isValidTimezone(timezone)) {
      return response.unprocessableEntity({
        errors: [{ field: 'timezone', message: 'Le fuseau horaire est invalide.' }],
      })
    }
    const requestedScheduledAt = Object.hasOwn(payload, 'scheduledAt')
      ? payload.scheduledAt
      : publication.scheduledAt?.toISO()
    const scheduled = parseScheduledAt(requestedScheduledAt, timezone)
    if (!scheduled.valid) {
      return response.unprocessableEntity({
        errors: [{ field: 'scheduledAt', message: 'La date souhaitée est invalide.' }],
      })
    }

    const next = {
      title: payload.title ?? publication.title,
      baseText: payload.baseText ?? publication.baseText,
      targetNetworks: payload.targetNetworks ?? publication.targetNetworks,
      scheduledAt: scheduled.value,
      timezone,
    }
    const changed =
      next.title !== publication.title ||
      next.baseText !== publication.baseText ||
      JSON.stringify(next.targetNetworks) !== JSON.stringify(publication.targetNetworks) ||
      (next.scheduledAt?.toISO() ?? null) !== (publication.scheduledAt?.toISO() ?? null) ||
      next.timezone !== publication.timezone
    if (!changed) return response.ok({ data: toPublicationView(publication) })

    const previous = {
      ...publicationSnapshot(publication),
      contentVersion: publication.contentVersion,
      approvedVersion: publication.approvedVersion,
    }
    const lifecycle = applyContentChange(publication)
    await db.transaction(async (trx) => {
      publication.useTransaction(trx)
      publication.merge({ ...next, ...lifecycle, updatedBy: actor.id })
      await publication.save()
      await PublicationVersion.create(
        {
          publicationId: publication.id,
          version: publication.contentVersion,
          snapshotJson: publicationSnapshot(publication),
          authorId: actor.id,
        },
        { client: trx }
      )
      await markNetworkVariantsStale(publication.id, publication.contentVersion, trx)
      await markPublicationTranslationsStale(publication.id, publication.contentVersion, trx)
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: publication.projectId,
          targetPublicationId: publication.id,
          action: 'publication.updated',
          previousValues: previous,
          nextValues: {
            ...publicationSnapshot(publication),
            contentVersion: publication.contentVersion,
            approvedVersion: publication.approvedVersion,
          },
        },
        { client: trx }
      )
    })
    logger.info({ event: 'publication.updated', publicationId: publication.id, actorId: actor.id })
    return response.ok({ data: toPublicationView(publication) })
  }

  async duplicate({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(showPublicationValidator)
    const source = await findAccessiblePublication(actor, params.id)
    if (!source) return response.notFound(notFound)
    const project = await findAccessibleProject(actor, source.projectId)
    if (!project || !canAcceptPublications(project.status)) {
      return response.conflict({ errors: [{ message: 'Le projet doit être actif.' }] })
    }
    const copy = await db.transaction(async (trx) => {
      const created = await Publication.create(
        {
          agencyId: source.agencyId,
          projectId: source.projectId,
          title: `${source.title.slice(0, 112)} (copie)`,
          baseText: source.baseText,
          status: 'draft',
          targetNetworks: source.targetNetworks,
          scheduledAt: source.scheduledAt,
          timezone: source.timezone,
          contentVersion: 1,
          approvedVersion: null,
          createdBy: actor.id,
          updatedBy: actor.id,
          archivedAt: null,
        },
        { client: trx }
      )
      await PublicationVersion.create(
        {
          publicationId: created.id,
          version: 1,
          snapshotJson: publicationSnapshot(created),
          authorId: actor.id,
        },
        { client: trx }
      )
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: created.projectId,
          targetPublicationId: created.id,
          action: 'publication.duplicated',
          previousValues: { sourcePublicationId: source.id },
          nextValues: { title: created.title, status: created.status },
        },
        { client: trx }
      )
      return created
    })
    logger.info({ event: 'publication.duplicated', publicationId: copy.id, sourceId: source.id })
    return response.created({ data: toPublicationView(copy) })
  }

  async archive({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(showPublicationValidator)
    const publication = await findAccessiblePublication(actor, params.id)
    if (!publication) return response.notFound(notFound)
    if (publication.status === 'archived')
      return response.ok({ data: toPublicationView(publication) })
    const previousStatus = publication.status
    if (
      ![
        'draft',
        'in_progress',
        'awaiting_client_review',
        'changes_requested',
        'approved',
        'scheduled',
        'failed',
        'published',
      ].includes(previousStatus)
    ) {
      return response.conflict({
        errors: [{ message: 'Cette publication ne peut pas être archivée.' }],
      })
    }
    await db.transaction(async (trx) => {
      publication.useTransaction(trx)
      publication.status = 'archived'
      publication.archivedAt = DateTime.utc()
      publication.updatedBy = actor.id
      await publication.save()
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: publication.projectId,
          targetPublicationId: publication.id,
          action: 'publication.archived',
          previousValues: { status: previousStatus },
          nextValues: { status: 'archived' },
        },
        { client: trx }
      )
    })
    logger.info({
      event: 'publication.archived',
      publicationId: publication.id,
      oldStatus: previousStatus,
    })
    return response.ok({ data: toPublicationView(publication) })
  }

  async transition({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(transitionPublicationValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(notFound)
    try {
      assertCurrentVersion(payload.contentVersion, publication.contentVersion)
    } catch (error) {
      if (error instanceof PublicationVersionConflictError)
        return response.conflict(conflict(error))
      throw error
    }
    let next
    try {
      next = transitionPublication(publication, payload.status)
    } catch {
      return response.conflict({
        errors: [{ message: `Transition interdite : ${publication.status} → ${payload.status}.` }],
      })
    }
    const previousStatus = publication.status
    await db.transaction(async (trx) => {
      publication.useTransaction(trx)
      publication.merge({
        ...next,
        archivedAt: next.status === 'archived' ? DateTime.utc() : publication.archivedAt,
        updatedBy: actor.id,
      })
      await publication.save()
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: publication.projectId,
          targetPublicationId: publication.id,
          action: 'publication.status_changed',
          previousValues: { status: previousStatus },
          nextValues: { status: publication.status, approvedVersion: publication.approvedVersion },
        },
        { client: trx }
      )
    })
    logger.info({
      event: 'publication.status_changed',
      publicationId: publication.id,
      oldStatus: previousStatus,
      newStatus: publication.status,
    })
    return response.ok({ data: toPublicationView(publication) })
  }
}
