import SystemStatusService from '#services/system/system_status_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class HealthController {
  private readonly systemStatus = new SystemStatusService()

  live({ response }: HttpContext) {
    return response.ok({ status: 'ok' })
  }

  async ready({ response }: HttpContext) {
    const readiness = await this.systemStatus.readiness()
    return response.status(readiness.ready ? 200 : 503).send(readiness)
  }
}
