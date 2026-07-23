import { heartbeatStatus, type WorkerHeartbeat } from '#domain/system/system_status'
import env from '#start/env'
import { Queue } from 'bullmq'

let queue: Queue | undefined

function getQueue() {
  queue ??= new Queue(env.get('EMAIL_QUEUE_NAME'), {
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

export function workerHeartbeatKey() {
  return `${env.get('REDIS_KEY_PREFIX')}:queue:${env.get('EMAIL_QUEUE_NAME')}:worker-heartbeat`
}

export async function queueSnapshot() {
  if (env.get('EMAIL_QUEUE_DRIVER') === 'memory') {
    return {
      status: 'disabled' as const,
      counts: { waiting: 0, active: 0, failed: 0, delayed: 0, completed: 0 },
      failedJobs: [],
      worker: {
        id: 'worker',
        label: 'Worker',
        status: 'disabled' as const,
        message: 'File mémoire active pour les tests.',
      },
    }
  }

  const currentQueue = getQueue()
  const [counts, failedJobs, client] = await Promise.all([
    currentQueue.getJobCounts('waiting', 'active', 'failed', 'delayed', 'completed'),
    currentQueue.getJobs(['failed'], 0, 9, true),
    currentQueue.client,
  ])
  const rawHeartbeat = await client.get(workerHeartbeatKey())
  let heartbeat: WorkerHeartbeat | null = null
  if (rawHeartbeat) {
    try {
      heartbeat = JSON.parse(rawHeartbeat) as WorkerHeartbeat
    } catch {
      heartbeat = null
    }
  }

  return {
    status: 'operational' as const,
    counts: {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      completed: counts.completed ?? 0,
    },
    failedJobs: failedJobs.map((job) => ({
      id: String(job.id),
      name: job.name,
      attemptsMade: job.attemptsMade,
      failedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      failure: 'job_failed',
    })),
    worker: heartbeatStatus(heartbeat),
  }
}

export async function retryFailedJob(jobId: string) {
  if (env.get('EMAIL_QUEUE_DRIVER') === 'memory') return 'unavailable' as const
  const job = await getQueue().getJob(jobId)
  if (!job) return 'not_found' as const
  if ((await job.getState()) !== 'failed') return 'not_failed' as const
  await job.retry('failed')
  return 'retried' as const
}
