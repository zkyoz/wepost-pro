import env from '#start/env'
import { Queue } from 'bullmq'

export const TIKTOK_JOB_NAME = 'publication-tiktok'
export type TikTokPublicationJob = { scheduledPublicationId: string }

let queue: Queue<TikTokPublicationJob> | undefined

function getQueue() {
  queue ??= new Queue<TikTokPublicationJob>(env.get('EMAIL_QUEUE_NAME'), {
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

export async function enqueueTikTokPublication(input: {
  scheduledPublicationId: string
  jobId: string
  runAt: Date
}) {
  if (env.get('EMAIL_QUEUE_DRIVER') === 'memory') return `memory-${input.jobId}`
  const job = await getQueue().add(
    TIKTOK_JOB_NAME,
    { scheduledPublicationId: input.scheduledPublicationId },
    {
      jobId: input.jobId,
      delay: Math.max(0, input.runAt.getTime() - Date.now()),
      attempts: 4,
      backoff: { type: 'wepost-social', delay: 60_000 },
      removeOnComplete: 1000,
      removeOnFail: false,
    }
  )
  return job.id!
}
