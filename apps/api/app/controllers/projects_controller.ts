import { archiveProject, restoreProject } from '#domain/projects/project_status'
import AuditLog from '#models/audit_log'
import Project from '#models/project'
import User from '#models/user'
import {
  findAccessibleProject,
  InvalidProjectAssignmentError,
  isValidTimezone,
  resolveProjectMembers,
  scopedProjectQuery,
  toProjectViews,
} from '#services/projects/project_service'
import {
  createProjectValidator,
  listProjectsValidator,
  projectIdValidator,
  updateProjectValidator,
} from '#validators/project_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const notFound = { errors: [{ message: 'Projet introuvable.' }] }
const invalidAssignment = (message: string) => ({ errors: [{ field: 'clientUserId', message }] })
type ArchiveContext = Pick<HttpContext, 'auth' | 'logger' | 'request' | 'response'>

export default class ProjectsController {
  async index({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { page = 1, perPage = 12, q, status } = await request.validateUsing(listProjectsValidator)
    const query = scopedProjectQuery(actor)
    if (q) query.whereILike('name', `%${q}%`)
    if (status) query.where('status', status)
    const paginator = await query.orderBy('updatedAt', 'desc').paginate(page, perPage)
    const views = await toProjectViews(paginator.all())

    const counts = await scopedProjectQuery(actor)
      .select('status')
      .count('* as total')
      .groupBy('status')
    const totals = { active: 0, archived: 0 }
    for (const count of counts) totals[count.status] = Number(count.$extras.total)

    return response.ok({ data: views, meta: { ...paginator.getMeta(), counts: totals } })
  }

  async clients({ auth, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const query = User.query()
      .where('role', 'client')
      .where('isActive', true)
      .orderBy('displayName')
    if (actor.role === 'agency') {
      if (!actor.agencyId) return response.ok({ data: [] })
      query.where('agencyId', actor.agencyId)
    }
    const clients = await query
    return response.ok({
      data: clients.map(({ id, displayName, email, agencyId }) => ({
        id,
        displayName,
        email,
        agencyId,
      })),
    })
  }

  async store({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createProjectValidator)
    if (!isValidTimezone(payload.timezone)) {
      return response.unprocessableEntity({
        errors: [{ field: 'timezone', message: 'Le fuseau horaire est invalide.' }],
      })
    }

    let assignment
    try {
      assignment = await resolveProjectMembers(actor, payload.clientUserId, payload.memberUserIds)
    } catch (error) {
      if (!(error instanceof InvalidProjectAssignmentError)) throw error
      return response.unprocessableEntity(invalidAssignment(error.message))
    }

    const project = await db.transaction(async (trx) => {
      const created = await Project.create(
        {
          agencyId: assignment.agencyId,
          name: payload.name,
          description: payload.description ?? '',
          status: 'active',
          clientUserId: payload.clientUserId,
          timezone: payload.timezone,
          createdBy: actor.id,
        },
        { client: trx }
      )
      await trx.table('project_members').insert(
        assignment.members.map((member) => ({
          project_id: created.id,
          user_id: member.id,
          membership_role: member.id === payload.clientUserId ? 'primary' : 'member',
          created_at: DateTime.utc().toJSDate(),
        }))
      )
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetProjectId: created.id,
          targetUserId: null,
          action: 'project.created',
          previousValues: {},
          nextValues: { name: created.name, clientUserId: created.clientUserId },
        },
        { client: trx }
      )
      return created
    })

    logger.info({ event: 'project.created', projectId: project.id, actorId: actor.id })
    const [view] = await toProjectViews([project])
    return response.created({ data: view })
  }

  async show({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(projectIdValidator)
    const project = await findAccessibleProject(actor, params.id)
    if (!project) return response.notFound(notFound)
    const history = await AuditLog.query()
      .where('targetProjectId', project.id)
      .orderBy('createdAt', 'desc')
      .limit(10)
    const [view] = await toProjectViews([project])
    return response.ok({
      data: {
        ...view,
        history: history.map((entry) => ({
          action: entry.action,
          createdAt: entry.createdAt.toUTC().toISO(),
        })),
      },
    })
  }

  async update({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(updateProjectValidator)
    const project = await findAccessibleProject(actor, payload.params.id)
    if (!project) return response.notFound(notFound)
    if (project.status === 'archived') {
      return response.conflict({
        errors: [{ message: 'Réactivez le projet avant de le modifier.' }],
      })
    }
    if (payload.timezone && !isValidTimezone(payload.timezone)) {
      return response.unprocessableEntity({
        errors: [{ field: 'timezone', message: 'Le fuseau horaire est invalide.' }],
      })
    }

    const currentMembers = await db
      .from('project_members')
      .where('project_id', project.id)
      .select('user_id')
    const clientUserId = payload.clientUserId ?? project.clientUserId
    const requestedMembers =
      payload.memberUserIds ?? currentMembers.map((membership) => membership.user_id)
    let assignment
    try {
      assignment = await resolveProjectMembers(actor, clientUserId, requestedMembers)
    } catch (error) {
      if (!(error instanceof InvalidProjectAssignmentError)) throw error
      return response.unprocessableEntity(invalidAssignment(error.message))
    }

    const previous = {
      name: project.name,
      description: project.description,
      clientUserId: project.clientUserId,
      timezone: project.timezone,
    }
    const clientChanged = project.clientUserId !== clientUserId
    await db.transaction(async (trx) => {
      project.useTransaction(trx)
      project.merge({
        agencyId: assignment.agencyId,
        name: payload.name ?? project.name,
        description: payload.description ?? project.description,
        clientUserId,
        timezone: payload.timezone ?? project.timezone,
      })
      await project.save()
      await trx.from('project_members').where('project_id', project.id).delete()
      await trx.table('project_members').insert(
        assignment.members.map((member) => ({
          project_id: project.id,
          user_id: member.id,
          membership_role: member.id === clientUserId ? 'primary' : 'member',
          created_at: DateTime.utc().toJSDate(),
        }))
      )
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetProjectId: project.id,
          targetUserId: null,
          action: clientChanged ? 'project.client_changed' : 'project.updated',
          previousValues: previous,
          nextValues: {
            name: project.name,
            description: project.description,
            clientUserId: project.clientUserId,
            timezone: project.timezone,
          },
        },
        { client: trx }
      )
    })

    logger.info({ event: 'project.updated', projectId: project.id, actorId: actor.id })
    const [view] = await toProjectViews([project])
    return response.ok({ data: view })
  }

  async archive({ auth, logger, request, response }: HttpContext) {
    return this.changeArchiveState({ auth, logger, request, response }, true)
  }

  async restore({ auth, logger, request, response }: HttpContext) {
    return this.changeArchiveState({ auth, logger, request, response }, false)
  }

  private async changeArchiveState(
    { auth, logger, request, response }: ArchiveContext,
    archived: boolean
  ) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(projectIdValidator)
    const project = await findAccessibleProject(actor, params.id)
    if (!project) return response.notFound(notFound)
    const transition = archived ? archiveProject(project.status) : restoreProject(project.status)

    if (transition.changed) {
      await db.transaction(async (trx) => {
        project.useTransaction(trx)
        project.status = transition.status
        project.archivedAt = archived ? DateTime.utc() : null
        await project.save()
        await AuditLog.create(
          {
            actorUserId: actor.id,
            targetProjectId: project.id,
            targetUserId: null,
            action: archived ? 'project.archived' : 'project.restored',
            previousValues: { status: archived ? 'active' : 'archived' },
            nextValues: { status: transition.status },
          },
          { client: trx }
        )
      })
    }

    logger.info({
      event: archived ? 'project.archived' : 'project.restored',
      projectId: project.id,
    })
    const [view] = await toProjectViews([project])
    return response.ok({ data: view })
  }
}
