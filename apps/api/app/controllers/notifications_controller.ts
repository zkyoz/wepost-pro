import Notification from '#models/notification'
import {
  listNotificationsValidator,
  updateNotificationValidator,
} from '#validators/collaboration_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

function view(notification: Notification) {
  return {
    id: notification.id,
    type: notification.type,
    payload: notification.payloadJson,
    readAt: notification.readAt?.toUTC().toISO() ?? null,
    createdAt: notification.createdAt.toUTC().toISO()!,
    emailStatus: notification.emailStatus,
    emailAttempts: notification.emailAttempts,
  }
}

export default class NotificationsController {
  async index({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const {
      page = 1,
      perPage = 20,
      unread,
    } = await request.validateUsing(listNotificationsValidator)
    const query = Notification.query().where('userId', actor.id)
    if (unread === true) query.whereNull('readAt')
    if (unread === false) query.whereNotNull('readAt')
    const [paginator, unreadCount] = await Promise.all([
      query.orderBy('createdAt', 'desc').paginate(page, perPage),
      Notification.query()
        .where('userId', actor.id)
        .whereNull('readAt')
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
    ])
    return response.ok({
      data: paginator.all().map(view),
      meta: { ...paginator.getMeta(), unreadCount },
    })
  }

  async update({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(updateNotificationValidator)
    const notification = await Notification.query()
      .where('id', payload.params.id)
      .where('userId', actor.id)
      .first()
    if (!notification) {
      return response.notFound({ errors: [{ message: 'Notification introuvable.' }] })
    }
    notification.readAt = payload.read ? DateTime.utc() : null
    await notification.save()
    return response.ok({ data: view(notification) })
  }
}
