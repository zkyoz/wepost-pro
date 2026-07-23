import type Notification from '#models/notification'
import { dispatchNotificationEmails } from '#services/notifications/email_queue'
import type { Logger } from '@adonisjs/core/logger'
import { test } from '@japa/runner'

test.group('Notification email queue', () => {
  test('records enqueue failure without rejecting the business operation', async ({ assert }) => {
    let saved = false
    let logged = false
    const notification = {
      id: '70000000-0000-4000-8000-000000000003',
      emailStatus: 'pending',
      emailLastError: null,
      emailJobId: null,
      async save() {
        saved = true
      },
    } as unknown as Notification
    const logger = {
      error() {
        logged = true
      },
    } as unknown as Logger

    await assert.doesNotReject(() =>
      dispatchNotificationEmails([notification], logger, async () =>
        Promise.reject(new Error('RedisUnavailable'))
      )
    )
    assert.isTrue(saved)
    assert.isTrue(logged)
    assert.equal(notification.emailStatus, 'failed')
    assert.equal(notification.emailLastError, 'Impossible de placer le message dans la file.')
  })
})
