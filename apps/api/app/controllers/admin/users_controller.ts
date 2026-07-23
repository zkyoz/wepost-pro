import { assertActiveAdminRemains, LastActiveAdminError } from '#domain/admin/admin_guards'
import AuditLog from '#models/audit_log'
import User from '#models/user'
import { recordAdminAction } from '#services/admin/admin_metrics'
import { toPublicUser } from '#services/auth/public_user'
import {
  listAdminUsersValidator,
  updateUserRoleValidator,
  updateUserStatusValidator,
  userIdValidator,
} from '#validators/admin/user_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

const selfModificationError = {
  errors: [{ message: 'Vous ne pouvez pas modifier votre propre rôle ou statut.' }],
}
const lastAdminError = {
  errors: [{ message: 'Le dernier administrateur actif ne peut pas perdre son accès.' }],
}

export default class AdminUsersController {
  async index({ request, response }: HttpContext) {
    const {
      page = 1,
      perPage = 20,
      q,
      role,
      status,
    } = await request.validateUsing(listAdminUsersValidator)
    const query = User.query()
    if (q) {
      query.where((builder) => {
        builder.whereILike('displayName', `%${q}%`).orWhereILike('email', `%${q}%`)
      })
    }
    if (role) query.where('role', role)
    if (status) query.where('isActive', status === 'active')
    const paginator = await query.orderBy('createdAt', 'desc').paginate(page, perPage)
    return response.ok({
      data: paginator.all().map(toPublicUser),
      meta: paginator.getMeta(),
    })
  }

  async show({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(userIdValidator)
    const user = await User.find(params.id)
    if (!user) return response.notFound({ errors: [{ message: 'Ressource introuvable.' }] })
    return response.ok({ data: toPublicUser(user) })
  }

  async updateRole({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params, role } = await request.validateUsing(updateUserRoleValidator)
    const target = await User.find(params.id)
    if (!target) return response.notFound({ errors: [{ message: 'Ressource introuvable.' }] })
    if (actor.id === target.id) return response.forbidden(selfModificationError)

    const previousRole = target.role
    if (previousRole !== role) {
      try {
        await db.transaction(async (trx) => {
          const lockedTarget = await User.query({ client: trx })
            .where('id', target.id)
            .forUpdate()
            .firstOrFail()
          const activeAdmins = await User.query({ client: trx })
            .where('role', 'admin')
            .where('isActive', true)
            .select('id')
            .forUpdate()
          assertActiveAdminRemains({
            targetRole: lockedTarget.role,
            targetIsActive: lockedTarget.isActive,
            nextRole: role,
            nextIsActive: lockedTarget.isActive,
            activeAdminCount: activeAdmins.length,
          })
          lockedTarget.role = role
          await lockedTarget.save()
          await AuditLog.create(
            {
              actorUserId: actor.id,
              targetUserId: lockedTarget.id,
              action: 'user.role_changed',
              previousValues: { role: previousRole },
              nextValues: { role },
            },
            { client: trx }
          )
        })
      } catch (error) {
        if (error instanceof LastActiveAdminError) return response.conflict(lastAdminError)
        throw error
      }
      target.role = role
      const metricValue = recordAdminAction('user.role_changed')
      logger.info({
        event: 'admin.action',
        action: 'user.role_changed',
        actorId: actor.id,
        targetId: target.id,
        metric: 'admin_action_total',
        metricValue,
      })
    }

    return response.ok({ data: toPublicUser(target) })
  }

  async updateStatus({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params, isActive } = await request.validateUsing(updateUserStatusValidator)
    const target = await User.find(params.id)
    if (!target) return response.notFound({ errors: [{ message: 'Ressource introuvable.' }] })
    if (actor.id === target.id) return response.forbidden(selfModificationError)

    const previousStatus = target.isActive
    if (previousStatus !== isActive) {
      try {
        await db.transaction(async (trx) => {
          const lockedTarget = await User.query({ client: trx })
            .where('id', target.id)
            .forUpdate()
            .firstOrFail()
          const activeAdmins = await User.query({ client: trx })
            .where('role', 'admin')
            .where('isActive', true)
            .select('id')
            .forUpdate()
          assertActiveAdminRemains({
            targetRole: lockedTarget.role,
            targetIsActive: lockedTarget.isActive,
            nextRole: lockedTarget.role,
            nextIsActive: isActive,
            activeAdminCount: activeAdmins.length,
          })
          lockedTarget.isActive = isActive
          await lockedTarget.save()
          await AuditLog.create(
            {
              actorUserId: actor.id,
              targetUserId: lockedTarget.id,
              action: isActive ? 'user.reactivated' : 'user.deactivated',
              previousValues: { isActive: previousStatus },
              nextValues: { isActive },
            },
            { client: trx }
          )
        })
      } catch (error) {
        if (error instanceof LastActiveAdminError) return response.conflict(lastAdminError)
        throw error
      }
      target.isActive = isActive
      const action = isActive ? 'user.reactivated' : 'user.deactivated'
      const metricValue = recordAdminAction(action)
      logger.warn({
        event: 'admin.action',
        action,
        actorId: actor.id,
        targetId: target.id,
        metric: 'admin_action_total',
        metricValue,
      })
    }

    return response.ok({ data: toPublicUser(target) })
  }
}
