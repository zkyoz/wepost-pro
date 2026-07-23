import type { AiGenerationInput } from '#domain/ai/text_generation'
import env from '#start/env'
import { Queue } from 'bullmq'

export const AI_TEXT_JOB_NAME = 'ai-text-generation'
export type AiTextGenerationJob = { generationId: string; input: AiGenerationInput }

let queue: Queue<AiTextGenerationJob> | undefined

function getQueue() {
  queue ??= new Queue<AiTextGenerationJob>(env.get('EMAIL_QUEUE_NAME'), {
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

export async function enqueueAiTextGeneration(generationId: string, input: AiGenerationInput) {
  const job = await getQueue().add(
    AI_TEXT_JOB_NAME,
    { generationId, input },
    {
      jobId: `ai-${generationId}`,
      attempts: 3,
      backoff: { type: 'wepost-ai', delay: 5_000 },
      removeOnComplete: 1000,
      removeOnFail: false,
    }
  )
  return job.id!
}
