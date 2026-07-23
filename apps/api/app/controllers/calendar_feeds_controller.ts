import { InvalidCalendarDateError, parseCalendarRange } from '#domain/calendar/calendar'
import {
  calendarFeedAccessTotal,
  createCalendarFeed,
  exportCalendarIcs,
  listCalendarFeeds,
  resolveCalendarFeed,
  revokeCalendarFeed,
} from '#services/calendar/calendar_feed_service'
import { isValidTimezone } from '#services/projects/project_service'
import {
  calendarExportValidator,
  calendarFeedIdValidator,
  createCalendarFeedValidator,
} from '#validators/calendar_feed_validator'
import type { HttpContext } from '@adonisjs/core/http'

const notFound = { errors: [{ message: 'Flux de calendrier introuvable.' }] }

function sendIcs(
  response: HttpContext['response'],
  ics: string,
  disposition: 'attachment' | 'inline'
) {
  response.header('Content-Type', 'text/calendar; charset=utf-8')
  response.header('Content-Disposition', `${disposition}; filename="wepost-calendrier.ics"`)
  response.header('Cache-Control', 'private, no-store')
  response.header('X-Content-Type-Options', 'nosniff')
  return response.send(ics)
}

export default class CalendarFeedsController {
  async export({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(calendarExportValidator)
    if (!isValidTimezone(payload.timezone)) {
      return response.unprocessableEntity({ errors: [{ message: 'Fuseau horaire invalide.' }] })
    }
    try {
      const range = parseCalendarRange(payload.start, payload.end, payload.timezone)
      const calendar = await exportCalendarIcs(actor, { ...payload, range })
      if (!calendar) return response.notFound({ errors: [{ message: 'Projet introuvable.' }] })
      logger.info({
        event: 'calendar.ics_exported',
        actorId: actor.id,
        projectId: payload.projectId ?? null,
        eventCount: calendar.eventCount,
      })
      return sendIcs(response, calendar.ics, 'attachment')
    } catch (error) {
      if (error instanceof InvalidCalendarDateError) {
        return response.unprocessableEntity({ errors: [{ message: error.message }] })
      }
      throw error
    }
  }

  async index({ auth, response }: HttpContext) {
    return response.ok({ data: await listCalendarFeeds(auth.getUserOrFail()) })
  }

  async store({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createCalendarFeedValidator)
    const created = await createCalendarFeed(actor, payload.projectId)
    if (!created) return response.notFound({ errors: [{ message: 'Projet introuvable.' }] })
    const path = `/api/v1/calendar/feeds/${created.token}`
    logger.info({
      event: 'calendar.feed_created',
      actorId: actor.id,
      feedId: created.data.id,
      projectId: created.data.projectId,
    })
    return response.created({ data: created.data, feedPath: path })
  }

  async destroy({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(calendarFeedIdValidator)
    const feed = await revokeCalendarFeed(actor, params.id)
    if (!feed) return response.notFound(notFound)
    logger.info({ event: 'calendar.feed_revoked', actorId: actor.id, feedId: feed.id })
    return response.noContent()
  }

  async show({ logger, request, response }: HttpContext) {
    const token = request.param('token')
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{64}$/.test(token)) {
      return response.notFound(notFound)
    }
    const calendar = await resolveCalendarFeed(token)
    if (!calendar) return response.notFound(notFound)
    logger.info({
      event: 'calendar.feed_accessed',
      feedId: calendar.feedId,
      actorId: calendar.actorId,
      eventCount: calendar.eventCount,
      feedAccessTotal: calendarFeedAccessTotal(),
    })
    return sendIcs(response, calendar.ics, 'inline')
  }
}
