import {
  aggregateReadiness,
  type SystemComponent,
  type SystemComponentStatus,
} from '#domain/system/system_status'
import PublicationAttempt from '#models/publication_attempt'
import SocialAccount from '#models/social_account'
import { httpMetricsSnapshot } from '#services/system/runtime_metrics'
import { queueSnapshot } from '#services/system/queue_monitor'
import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import redis from '@adonisjs/redis/services/main'
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { DateTime } from 'luxon'

type Probe = () => Promise<void>

async function componentProbe(
  id: string,
  label: string,
  probe: Probe,
  successMessage = 'Disponible.'
): Promise<SystemComponent> {
  const startedAt = performance.now()
  try {
    await probe()
    return {
      id,
      label,
      status: 'operational',
      message: successMessage,
      latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
    }
  } catch {
    return {
      id,
      label,
      status: 'down',
      message: 'Dépendance indisponible.',
      latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
    }
  }
}

export type SystemStatusDependencies = {
  database: Probe
  redis: Probe
  queue: typeof queueSnapshot
}

function defaultDependencies(): SystemStatusDependencies {
  return {
    database: async () => {
      await db.rawQuery('SELECT 1')
    },
    redis: async () => {
      await redis.connection('session').ping()
    },
    queue: queueSnapshot,
  }
}

async function r2Status(): Promise<SystemComponent> {
  if (env.get('MEDIA_STORAGE_DRIVER') !== 'r2') {
    return {
      id: 'r2',
      label: 'Cloudflare R2',
      status: 'disabled',
      message: 'Stockage local actif.',
    }
  }
  const accountId = env.get('R2_ACCOUNT_ID')
  const bucket = env.get('R2_BUCKET')
  const accessKeyId = env.get('R2_ACCESS_KEY_ID')
  const secretAccessKey = env.get('R2_SECRET_ACCESS_KEY')
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    return {
      id: 'r2',
      label: 'Cloudflare R2',
      status: 'down',
      message: 'Configuration R2 incomplète.',
    }
  }
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
  return componentProbe('r2', 'Cloudflare R2', async () => {
    await client.send(new HeadBucketCommand({ Bucket: bucket }), {
      abortSignal: AbortSignal.timeout(3_000),
    })
  })
}

async function integrationsStatus(workerStatus: SystemComponentStatus) {
  const accounts = await SocialAccount.query()
    .select('network', 'status')
    .count('* as total')
    .groupBy('network', 'status')
  const failures = await PublicationAttempt.query()
    .whereIn('result', ['transient_failure', 'permanent_failure'])
    .where('startedAt', '>=', DateTime.utc().minus({ hours: 24 }).toSQL()!)
    .count('* as total')
    .first()

  const networkDrivers = {
    facebook: env.get('FACEBOOK_API_DRIVER') ?? 'mock',
    instagram: env.get('INSTAGRAM_API_DRIVER') ?? 'mock',
    linkedin: env.get('LINKEDIN_API_DRIVER') ?? 'mock',
    pinterest: env.get('PINTEREST_API_DRIVER') ?? 'mock',
    tiktok: env.get('TIKTOK_API_DRIVER') ?? 'mock',
  }
  const socialAccounts = accounts.map((row) => ({
    network: row.network,
    status: row.status,
    total: Number(row.$extras.total),
  }))
  const failureCount = Number(failures?.$extras.total ?? 0)

  return {
    mail: {
      id: 'mail',
      label: 'E-mails transactionnels',
      status:
        env.get('EMAIL_QUEUE_DRIVER') === 'memory'
          ? ('disabled' as const)
          : workerStatus === 'operational'
            ? ('operational' as const)
            : ('degraded' as const),
      message:
        env.get('EMAIL_QUEUE_DRIVER') === 'memory'
          ? 'Envoi simulé.'
          : workerStatus === 'operational'
            ? 'Traitement asynchrone disponible.'
            : 'Le worker ne répond pas.',
    },
    social: {
      drivers: networkDrivers,
      accounts: socialAccounts,
      failures24h: failureCount,
      status: failureCount > 0 ? ('degraded' as const) : ('operational' as const),
    },
  }
}

export default class SystemStatusService {
  constructor(private readonly dependencies = defaultDependencies()) {}

  async readiness() {
    const components = await Promise.all([
      componentProbe('database', 'PostgreSQL', this.dependencies.database),
      componentProbe('redis', 'Redis', this.dependencies.redis),
      componentProbe('queue', 'File BullMQ', async () => {
        await this.dependencies.queue()
      }),
    ])
    return aggregateReadiness(components)
  }

  async status() {
    const [database, redisStatus, queue, r2] = await Promise.all([
      componentProbe('database', 'PostgreSQL', this.dependencies.database),
      componentProbe('redis', 'Redis', this.dependencies.redis),
      this.dependencies.queue(),
      r2Status(),
    ])
    const queueComponent: SystemComponent = {
      id: 'queue',
      label: 'File BullMQ',
      status: queue.status,
      message: queue.status === 'disabled' ? 'File mémoire active.' : 'File Redis disponible.',
    }
    const integrations = await integrationsStatus(queue.worker.status)
    return {
      generatedAt: new Date().toISOString(),
      environment: env.get('NODE_ENV'),
      release: process.env.GIT_SHA || 'unknown',
      overall: aggregateReadiness([database, redisStatus, queueComponent]).status,
      components: [
        {
          id: 'api',
          label: 'API',
          status: 'operational' as const,
          message: 'Processus en cours.',
        },
        database,
        redisStatus,
        queueComponent,
        queue.worker,
        r2,
        integrations.mail,
      ],
      queue: {
        ...queue.counts,
        failedJobs: queue.failedJobs,
      },
      social: integrations.social,
      metrics: {
        http: httpMetricsSnapshot(),
        process: {
          uptimeSeconds: Math.round(process.uptime()),
          memoryRssBytes: process.memoryUsage().rss,
          cpuUserMicroseconds: process.cpuUsage().user,
        },
      },
    }
  }
}
