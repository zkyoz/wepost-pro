import AuditLog from '#models/audit_log'
import { retryFailedJob } from '#services/system/queue_monitor'
import SystemStatusService from '#services/system/system_status_service'
import type { HttpContext } from '@adonisjs/core/http'

const SAFE_JOB_ID = /^[a-zA-Z0-9:_-]{1,128}$/

export default class AdminSystemController {
  private readonly systemStatus = new SystemStatusService()

  async status({ response }: HttpContext) {
    return response.ok({ data: await this.systemStatus.status() })
  }

  async metrics({ response }: HttpContext) {
    const status = await this.systemStatus.status()
    return response.ok({
      data: {
        generatedAt: status.generatedAt,
        queue: status.queue,
        social: status.social,
        metrics: status.metrics,
      },
    })
  }

  async retry({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const jobId = request.param('jobId')
    if (typeof jobId !== 'string' || !SAFE_JOB_ID.test(jobId)) {
      return response.unprocessableEntity({
        errors: [{ message: 'Identifiant de job invalide.' }],
      })
    }

    const result = await retryFailedJob(jobId)
    if (result === 'not_found') {
      return response.notFound({ errors: [{ message: 'Job introuvable.' }] })
    }
    if (result === 'not_failed') {
      return response.conflict({ errors: [{ message: 'Ce job ne peut pas être relancé.' }] })
    }
    if (result === 'unavailable') {
      return response.serviceUnavailable({
        errors: [{ message: 'La file persistante est indisponible dans cet environnement.' }],
      })
    }

    await AuditLog.create({
      actorUserId: actor.id,
      action: 'system.job_retry_requested',
      entityType: 'queue_job',
      entityId: jobId,
      previousValues: { status: 'failed' },
      nextValues: { status: 'waiting' },
    })
    logger.warn({
      event: 'system.job_retry_requested',
      actorId: actor.id,
      jobId,
      metric: 'system_job_retry_total',
    })
    return response.ok({ data: { id: jobId, status: 'waiting' } })
  }
}
