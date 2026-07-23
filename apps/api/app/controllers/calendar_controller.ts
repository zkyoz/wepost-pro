import {
  InvalidCalendarDateError,
  nextCalendarVersion,
  parseCalendarDate,
  parseCalendarRange,
} from '#domain/calendar/calendar'
import {
  PublicationVersionConflictError,
  assertCurrentVersion,
} from '#domain/publications/publication_lifecycle'
import AuditLog from '#models/audit_log'
import Publication from '#models/publication'
import PublicationVersion from '#models/publication_version'
import User from '#models/user'
import {
  findAccessiblePublication,
  publicationSnapshot,
  toPublicationView,
} from '#services/publications/publication_service'
import { isValidTimezone, scopedProjectQuery } from '#services/projects/project_service'
import {
  listCalendarValidator,
  moveCalendarPublicationValidator,
} from '#validators/calendar_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

const notFound = { errors: [{ message: 'Publication introuvable.' }] }

function versionConflict(error: PublicationVersionConflictError) {
  return {
    errors: [{ message: error.message }],
    meta: { currentVersion: error.currentVersion },
  }
}

export default class CalendarController {
  async index({ auth, logger, request, response }: HttpContext) {
    const startedAt = performance.now()
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(listCalendarValidator)
    if (!isValidTimezone(payload.timezone)) {
      return response.unprocessableEntity({
        errors: [{ field: 'timezone', message: 'Le fuseau horaire est invalide.' }],
      })
    }

    let range
    try {
      range = parseCalendarRange(payload.start, payload.end, payload.timezone)
    } catch (error) {
      if (error instanceof InvalidCalendarDateError) {
        return response.unprocessableEntity({ errors: [{ message: error.message }] })
      }
      throw error
    }

    const accessibleProjects = await scopedProjectQuery(actor).orderBy('name')
    const filteredProjects = accessibleProjects.filter(
      (project) =>
        (!payload.projectId || project.id === payload.projectId) &&
        (!payload.clientId || project.clientUserId === payload.clientId)
    )
    const projectIds = filteredProjects.map((project) => project.id)
    const query = Publication.query().whereIn('projectId', projectIds)
    query.where((dateQuery) => {
      dateQuery
        .where((scheduledQuery) => {
          scheduledQuery
            .where('scheduledAt', '>=', range.startUtc.toSQL()!)
            .where('scheduledAt', '<', range.endUtc.toSQL()!)
        })
        .if(payload.includeUndated ?? true, (includeQuery) =>
          includeQuery.orWhereNull('scheduledAt')
        )
    })
    if (payload.status) query.where('status', payload.status)
    if (payload.network) query.whereRaw('? = ANY(target_networks)', [payload.network])

    const paginator = await query
      .orderByRaw('scheduled_at ASC NULLS LAST')
      .orderBy('title')
      .paginate(payload.page ?? 1, payload.perPage ?? 100)
    const projectsById = new Map(accessibleProjects.map((project) => [project.id, project]))
    const clientIds = [...new Set(accessibleProjects.map((project) => project.clientUserId))]
    const clients = clientIds.length
      ? await User.query().whereIn('id', clientIds).orderBy('displayName')
      : []
    const clientsById = new Map(clients.map((client) => [client.id, client]))
    const durationMs = Math.round((performance.now() - startedAt) * 100) / 100

    logger.info({
      event: 'calendar.listed',
      actorId: actor.id,
      durationMs,
      total: paginator.getMeta().total,
    })
    return response.ok({
      data: paginator.all().map((publication) => {
        const project = projectsById.get(publication.projectId)!
        return {
          ...toPublicationView(publication),
          projectName: project.name,
          projectTimezone: project.timezone,
          clientId: project.clientUserId,
          clientName: clientsById.get(project.clientUserId)?.displayName ?? 'Client',
        }
      }),
      meta: {
        ...paginator.getMeta(),
        start: range.startUtc.toISO(),
        end: range.endUtc.toISO(),
        timezone: payload.timezone,
        durationMs,
      },
      filters: {
        projects: accessibleProjects.map((project) => ({
          id: project.id,
          name: project.name,
          clientId: project.clientUserId,
          timezone: project.timezone,
        })),
        clients: clients.map((client) => ({ id: client.id, name: client.displayName })),
      },
    })
  }

  async move({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(moveCalendarPublicationValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(notFound)
    if (!isValidTimezone(payload.timezone)) {
      return response.unprocessableEntity({
        errors: [{ field: 'timezone', message: 'Le fuseau horaire est invalide.' }],
      })
    }
    try {
      assertCurrentVersion(payload.contentVersion, publication.contentVersion)
    } catch (error) {
      if (error instanceof PublicationVersionConflictError) {
        return response.conflict(versionConflict(error))
      }
      throw error
    }

    let scheduledAt = null
    try {
      scheduledAt = payload.scheduledAt
        ? parseCalendarDate(payload.scheduledAt, payload.timezone)
        : null
    } catch (error) {
      if (error instanceof InvalidCalendarDateError) {
        return response.unprocessableEntity({
          errors: [{ field: 'scheduledAt', message: error.message }],
        })
      }
      throw error
    }
    if (
      publication.timezone === payload.timezone &&
      (publication.scheduledAt?.toISO() ?? null) === (scheduledAt?.toISO() ?? null)
    ) {
      return response.ok({ data: toPublicationView(publication) })
    }

    let version
    try {
      version = nextCalendarVersion(publication)
    } catch (error) {
      return response.conflict({
        errors: [{ message: error instanceof Error ? error.message : 'Déplacement interdit.' }],
      })
    }
    const previous = {
      scheduledAt: publication.scheduledAt?.toUTC().toISO() ?? null,
      timezone: publication.timezone,
      contentVersion: publication.contentVersion,
      status: publication.status,
      approvedVersion: publication.approvedVersion,
    }
    await db.transaction(async (trx) => {
      publication.useTransaction(trx)
      publication.merge({
        scheduledAt,
        timezone: payload.timezone,
        ...version,
        updatedBy: actor.id,
      })
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
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: publication.projectId,
          targetPublicationId: publication.id,
          targetMediaId: null,
          action: 'publication.calendar_moved',
          previousValues: previous,
          nextValues: {
            scheduledAt: publication.scheduledAt?.toUTC().toISO() ?? null,
            timezone: publication.timezone,
            contentVersion: publication.contentVersion,
            status: publication.status,
            approvedVersion: publication.approvedVersion,
          },
        },
        { client: trx }
      )
    })
    logger.info({
      event: 'publication.calendar_moved',
      actorId: actor.id,
      publicationId: publication.id,
      previousScheduledAt: previous.scheduledAt,
      scheduledAt: publication.scheduledAt?.toUTC().toISO() ?? null,
    })
    return response.ok({ data: toPublicationView(publication) })
  }
}
