import {
  AI_PROMPT_VERSION,
  aiInputHash,
  buildVersionedPrompt,
  parseAiProviderOutput,
  type AiGenerationInput,
} from '#domain/ai/text_generation'
import AiGeneration from '#models/ai_generation'
import type Publication from '#models/publication'
import type User from '#models/user'
import { enqueueAiTextGeneration } from '#services/ai/ai_queue'
import {
  AiProviderUnavailableError,
  DisabledAiTextProvider,
  MockAiTextProvider,
  ProtectedAiTextProvider,
  type AiTextProvider,
} from '#services/ai/ai_provider'
import env from '#start/env'
import { DateTime } from 'luxon'

export class AiQuotaExceededError extends Error {}

export function getConfiguredAiProvider(): AiTextProvider {
  const driver =
    env.get('AI_PROVIDER_DRIVER') ?? (env.get('NODE_ENV') === 'production' ? 'disabled' : 'mock')
  return new ProtectedAiTextProvider(
    driver === 'mock' ? new MockAiTextProvider() : new DisabledAiTextProvider()
  )
}

export function toAiGenerationView(generation: AiGeneration) {
  return {
    id: generation.id,
    publicationId: generation.publicationId,
    provider: generation.provider,
    model: generation.model,
    promptVersion: generation.promptVersion,
    status: generation.status,
    variants: generation.outputJson.variants ?? [],
    warnings: generation.outputJson.warnings ?? [],
    usage: generation.usageJson,
    errorCode: generation.errorCode,
    appliedVariantId: generation.appliedVariantId,
    createdAt: generation.createdAt.toUTC().toISO()!,
    completedAt: generation.completedAt?.toUTC().toISO() ?? null,
    cancelledAt: generation.cancelledAt?.toUTC().toISO() ?? null,
    appliedAt: generation.appliedAt?.toUTC().toISO() ?? null,
  }
}

export async function assertAiQuota(actor: User) {
  const limit = env.get('AI_DAILY_QUOTA') ?? 50
  const rows = await AiGeneration.query()
    .where('createdBy', actor.id)
    .where('createdAt', '>=', DateTime.utc().minus({ hours: 24 }).toSQL()!)
    .count('* as total')
  if (Number(rows[0].$extras.total) >= limit) throw new AiQuotaExceededError()
}

export async function executeAiGeneration(
  generation: AiGeneration,
  input: AiGenerationInput,
  provider: AiTextProvider = getConfiguredAiProvider()
) {
  const startedAt = performance.now()
  const prompt = buildVersionedPrompt(input)
  generation.status = 'processing'
  await generation.save()
  try {
    const result = await provider.generate({ ...input, brief: prompt.sanitizedBrief })
    generation.outputJson = {
      variants: parseAiProviderOutput(result.output, input),
      warnings: prompt.warnings,
    }
    generation.usageJson = {
      latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      providerUsage: result.usage ?? null,
    }
    generation.status = 'completed'
    generation.completedAt = DateTime.utc()
    generation.errorCode = null
    await generation.save()
    return generation
  } catch (error) {
    generation.status = 'failed'
    generation.errorCode = error instanceof Error ? error.name.slice(0, 80) : 'UnknownError'
    generation.usageJson = { latencyMs: Math.round((performance.now() - startedAt) * 100) / 100 }
    await generation.save()
    throw error
  }
}

export async function createAiGeneration(
  actor: User,
  publication: Publication,
  input: AiGenerationInput
) {
  await assertAiQuota(actor)
  const provider = getConfiguredAiProvider()
  if (provider.name === 'disabled')
    throw new AiProviderUnavailableError('Fournisseur indisponible.')
  const prompt = buildVersionedPrompt(input)
  const generation = await AiGeneration.create({
    agencyId: publication.agencyId,
    publicationId: publication.id,
    provider: provider.name,
    model: provider.model,
    promptVersion: AI_PROMPT_VERSION,
    inputHash: aiInputHash(input),
    outputJson: { variants: [], warnings: prompt.warnings },
    status: 'queued',
    usageJson: {},
    errorCode: null,
    appliedVariantId: null,
    createdBy: actor.id,
    completedAt: null,
    cancelledAt: null,
    appliedAt: null,
  })
  if (env.get('EMAIL_QUEUE_DRIVER') === 'memory') {
    await executeAiGeneration(generation, input, provider)
  } else {
    await enqueueAiTextGeneration(generation.id, { ...input, brief: prompt.sanitizedBrief })
  }
  return generation
}
