import { InvalidStatisticsPeriodError, parseStatisticsPeriod } from '#domain/statistics/statistics'
import { agencyStatistics, statisticsToCsv } from '#services/statistics/statistics_service'
import { statisticsValidator } from '#validators/statistics_validator'
import type { HttpContext } from '@adonisjs/core/http'

function invalidPeriod(response: HttpContext['response'], error: unknown) {
  if (!(error instanceof InvalidStatisticsPeriodError)) throw error
  return response.unprocessableEntity({ errors: [{ message: error.message }] })
}

export default class StatisticsController {
  async show({ auth, logger, request, response }: HttpContext) {
    const startedAt = performance.now()
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(statisticsValidator)
    try {
      const result = await agencyStatistics(
        actor,
        parseStatisticsPeriod(payload.from, payload.to),
        payload
      )
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100
      logger.info({
        event: 'statistics.generated',
        actorId: actor.id,
        durationMs,
        period: result.period,
        publications: result.totals.publications,
      })
      return response.ok({ data: result, meta: { durationMs } })
    } catch (error) {
      return invalidPeriod(response, error)
    }
  }

  async export({ auth, logger, request, response }: HttpContext) {
    const startedAt = performance.now()
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(statisticsValidator)
    try {
      const result = await agencyStatistics(
        actor,
        parseStatisticsPeriod(payload.from, payload.to),
        payload
      )
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100
      logger.info({ event: 'statistics.exported', actorId: actor.id, durationMs })
      response.header('Content-Type', 'text/csv; charset=utf-8')
      response.header(
        'Content-Disposition',
        `attachment; filename="wepost-statistiques-${payload.to}.csv"`
      )
      return response.send(statisticsToCsv(result))
    } catch (error) {
      return invalidPeriod(response, error)
    }
  }
}
