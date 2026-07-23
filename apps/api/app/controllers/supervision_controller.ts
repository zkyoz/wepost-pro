import {
  InvalidSupervisionPeriodError,
  parseSupervisionPeriod,
} from '#domain/supervision/supervision'
import {
  markSupervisionCommentRead,
  supervisionItems,
  supervisionSummary,
} from '#services/supervision/supervision_service'
import {
  supervisionItemsValidator,
  supervisionNotificationValidator,
  supervisionSummaryValidator,
} from '#validators/supervision_validator'
import type { HttpContext } from '@adonisjs/core/http'

function invalidPeriod(response: HttpContext['response'], error: unknown) {
  if (!(error instanceof InvalidSupervisionPeriodError)) throw error
  return response.unprocessableEntity({ errors: [{ message: error.message }] })
}

export default class SupervisionController {
  async summary({ auth, logger, request, response }: HttpContext) {
    const startedAt = performance.now()
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(supervisionSummaryValidator)
    try {
      const result = await supervisionSummary(actor, {
        ...payload,
        ...parseSupervisionPeriod(payload.from, payload.to),
      })
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100
      logger.info({
        event: 'supervision.summary',
        actorId: actor.id,
        durationMs,
        metric: 'supervision_action_required_total',
        metricValue: result.actionRequired,
        counts: result.counts,
      })
      return response.ok({ data: result, meta: { durationMs } })
    } catch (error) {
      return invalidPeriod(response, error)
    }
  }

  async items({ auth, logger, request, response }: HttpContext) {
    const startedAt = performance.now()
    const actor = auth.getUserOrFail()
    const {
      category,
      page = 1,
      perPage = 20,
      ...payload
    } = await request.validateUsing(supervisionItemsValidator)
    try {
      const result = await supervisionItems(
        actor,
        { ...payload, ...parseSupervisionPeriod(payload.from, payload.to) },
        category,
        page,
        perPage
      )
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100
      logger.info({
        event: 'supervision.items',
        actorId: actor.id,
        category,
        total: result.meta.total,
        durationMs,
      })
      return response.ok({ ...result, meta: { ...result.meta, durationMs } })
    } catch (error) {
      return invalidPeriod(response, error)
    }
  }

  async markRead({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(supervisionNotificationValidator)
    const notification = await markSupervisionCommentRead(actor, params.id)
    if (!notification) {
      return response.notFound({ errors: [{ message: 'Élément de supervision introuvable.' }] })
    }
    logger.info({
      event: 'supervision.comment_read',
      actorId: actor.id,
      notificationId: notification.id,
    })
    return response.ok({
      data: { id: notification.id, readAt: notification.readAt?.toUTC().toISO() },
    })
  }
}
