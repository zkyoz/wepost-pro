import type Notification from '#models/notification'
import env from '#start/env'
import type { Logger } from '@adonisjs/core/logger'
import { Queue } from 'bullmq'

export const EMAIL_JOB_NAME = 'notification-email'
export const EMAIL_TEMPLATE_VERSION = 'activity-v1'

export type NotificationEmailJob = {
  notificationId: string
  templateVersion: typeof EMAIL_TEMPLATE_VERSION
}

let queue: Queue<NotificationEmailJob> | undefined

function getQueue() {
  queue ??= new Queue<NotificationEmailJob>(env.get('EMAIL_QUEUE_NAME'), {
    connection: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD') || undefined,
      db: env.get('REDIS_QUEUE_DB'),
      maxRetriesPerRequest: 1,
    },
    prefix: `${env.get('REDIS_KEY_PREFIX')}:queue`,
  })
  return queue
}

export async function enqueueNotificationEmail(notificationId: string) {
  if (env.get('EMAIL_QUEUE_DRIVER') === 'memory') return `memory-${notificationId}`
  const job = await getQueue().add(
    EMAIL_JOB_NAME,
    { notificationId, templateVersion: EMAIL_TEMPLATE_VERSION },
    {
      jobId: `notification-${notificationId}`,
      attempts: 4,
      backoff: { type: 'wepost-email', delay: 60_000 },
      removeOnComplete: 1000,
      removeOnFail: false,
    }
  )
  return job.id!
}

export async function dispatchNotificationEmails(
  notifications: readonly Notification[],
  logger: Logger,
  enqueue: (notificationId: string) => Promise<string> = enqueueNotificationEmail
) {
  await Promise.all(
    notifications.map(async (notification) => {
      try {
        notification.emailJobId = await enqueue(notification.id)
      } catch (error) {
        notification.emailStatus = 'failed'
        notification.emailLastError = 'Impossible de placer le message dans la file.'
        logger.error({
          event: 'notification.email_enqueue_failed',
          notificationId: notification.id,
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
      }
      await notification.save()
    })
  )
}
