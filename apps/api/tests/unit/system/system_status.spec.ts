import { heartbeatStatus } from '#domain/system/system_status'
import { redactLoggedPath } from '#middleware/correlation_middleware'
import SystemStatusService from '#services/system/system_status_service'
import { test } from '@japa/runner'

test.group('System status domain', () => {
  test('marks a worker heartbeat as down after five minutes', ({ assert }) => {
    const now = Date.parse('2026-07-23T10:06:00.000Z')
    assert.equal(heartbeatStatus({ timestamp: '2026-07-23T10:00:00.000Z' }, now).status, 'down')
    assert.equal(
      heartbeatStatus({ timestamp: '2026-07-23T10:05:30.000Z' }, now).status,
      'operational'
    )
  })

  test('redacts signed calendar tokens from request logs', ({ assert }) => {
    assert.equal(
      redactLoggedPath('/api/v1/calendar/feeds/private-feed-token'),
      '/api/v1/calendar/feeds/[redacted]'
    )
  })

  test('reports unavailable readiness when a required dependency fails', async ({ assert }) => {
    const service = new SystemStatusService({
      database: async () => {
        throw new Error('database_unavailable')
      },
      redis: async () => {},
      queue: async () => ({
        status: 'operational',
        counts: { waiting: 0, active: 0, failed: 0, delayed: 0, completed: 0 },
        failedJobs: [],
        worker: {
          id: 'worker',
          label: 'Worker',
          status: 'operational',
          message: 'Heartbeat reçu.',
        },
      }),
    })

    const result = await service.readiness()
    assert.isFalse(result.ready)
    assert.equal(result.status, 'unavailable')
    assert.equal(result.components.find(({ id }) => id === 'database')?.status, 'down')
  })
})
