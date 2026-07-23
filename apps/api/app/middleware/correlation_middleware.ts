import { recordHttpRequest } from '#services/system/runtime_metrics'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { randomUUID } from 'node:crypto'

const SAFE_CORRELATION_ID = /^[a-zA-Z0-9._:-]{8,128}$/

export function redactLoggedPath(path: string) {
  return path.replace(/\/calendar\/feeds\/[^/?]+/, '/calendar/feeds/[redacted]')
}

export default class CorrelationMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const supplied = ctx.request.header('x-correlation-id')
    const correlationId = supplied && SAFE_CORRELATION_ID.test(supplied) ? supplied : randomUUID()
    const startedAt = performance.now()
    ctx.response.header('x-correlation-id', correlationId)

    try {
      await next()
    } finally {
      const durationMs = performance.now() - startedAt
      const statusCode = ctx.response.getStatus()
      recordHttpRequest(durationMs, statusCode)
      ctx.logger.info({
        event: 'http.request',
        correlation_id: correlationId,
        method: ctx.request.method(),
        path: redactLoggedPath(ctx.request.url(false)),
        statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
      })
    }
  }
}
