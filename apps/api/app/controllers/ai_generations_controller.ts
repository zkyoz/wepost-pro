import {
  applyContentChange,
  assertCurrentVersion,
  canEditPublication,
  PublicationVersionConflictError,
} from '#domain/publications/publication_lifecycle'
import AiGeneration from '#models/ai_generation'
import AuditLog from '#models/audit_log'
import PublicationVersion from '#models/publication_version'
import {
  AiQuotaExceededError,
  createAiGeneration,
  toAiGenerationView,
} from '#services/ai/ai_generation_service'
import { AiProviderUnavailableError } from '#services/ai/ai_provider'
import {
  findAccessiblePublication,
  publicationSnapshot,
  toPublicationView,
} from '#services/publications/publication_service'
import { markNetworkVariantsStale } from '#services/publications/network_variant_service'
import { markPublicationTranslationsStale } from '#services/i18n/translation_service'
import {
  aiGenerationParamsValidator,
  applyAiVariantValidator,
  createAiGenerationValidator,
} from '#validators/ai_generation_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const notFound = { errors: [{ message: 'Génération IA introuvable.' }] }

async function accessibleGeneration(actor: HttpContext['auth']['user'], id: string) {
  const generation = await AiGeneration.find(id)
  if (!generation || !actor) return null
  const publication = await findAccessiblePublication(actor, generation.publicationId)
  return publication ? { generation, publication } : null
}

export default class AiGenerationsController {
  async store({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createAiGenerationValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) {
      return response.notFound({ errors: [{ message: 'Publication introuvable.' }] })
    }
    try {
      const generation = await createAiGeneration(actor, publication, payload)
      await AuditLog.create({
        actorUserId: actor.id,
        targetPublicationId: publication.id,
        targetProjectId: publication.projectId,
        action: 'ai.generation_created',
        previousValues: {},
        nextValues: {
          generationId: generation.id,
          promptVersion: generation.promptVersion,
          provider: generation.provider,
          variantCount: payload.variantCount,
        },
      })
      logger.info({
        event: 'ai.generation_created',
        generationId: generation.id,
        actorId: actor.id,
        provider: generation.provider,
        model: generation.model,
        promptVersion: generation.promptVersion,
        status: generation.status,
        latencyMs: generation.usageJson.latencyMs,
      })
      return response.created({ data: toAiGenerationView(generation) })
    } catch (error) {
      if (error instanceof AiQuotaExceededError) {
        return response.tooManyRequests({ errors: [{ message: 'Quota quotidien IA atteint.' }] })
      }
      if (error instanceof AiProviderUnavailableError) {
        return response.serviceUnavailable({
          errors: [{ message: 'Le fournisseur IA est temporairement indisponible.' }],
        })
      }
      throw error
    }
  }

  async index({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(aiGenerationParamsValidator)
    const publication = await findAccessiblePublication(actor, params.id)
    if (!publication) return response.notFound(notFound)
    const generations = await AiGeneration.query()
      .where('publicationId', publication.id)
      .orderBy('createdAt', 'desc')
      .limit(20)
    return response.ok({ data: generations.map(toAiGenerationView) })
  }

  async show({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(aiGenerationParamsValidator)
    const found = await accessibleGeneration(actor, params.id)
    if (!found) return response.notFound(notFound)
    return response.ok({ data: toAiGenerationView(found.generation) })
  }

  async apply({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(applyAiVariantValidator)
    const found = await accessibleGeneration(actor, payload.params.id)
    if (!found) return response.notFound(notFound)
    const { generation, publication } = found
    if (generation.status !== 'completed') {
      return response.conflict({ errors: [{ message: 'La génération n’est pas terminée.' }] })
    }
    const variant = generation.outputJson.variants.find((item) => item.id === payload.variantId)
    if (!variant) {
      return response.unprocessableEntity({ errors: [{ message: 'Variante IA introuvable.' }] })
    }
    try {
      assertCurrentVersion(payload.contentVersion, publication.contentVersion)
    } catch (error) {
      if (error instanceof PublicationVersionConflictError) {
        return response.conflict({
          errors: [{ message: error.message }],
          meta: { currentVersion: error.currentVersion },
        })
      }
      throw error
    }
    if (!canEditPublication(publication.status)) {
      return response.conflict({
        errors: [{ message: 'Cette publication ne peut plus être modifiée.' }],
      })
    }
    const previous = publicationSnapshot(publication)
    const lifecycle = applyContentChange(publication)
    await db.transaction(async (trx) => {
      publication.useTransaction(trx)
      publication.merge({ baseText: variant.text, ...lifecycle, updatedBy: actor.id })
      await publication.save()
      await PublicationVersion.create(
        {
          publicationId: publication.id,
          version: publication.contentVersion,
          snapshotJson: publicationSnapshot(publication),
          authorId: actor.id,
        },
        { client: trx }
      )
      await markNetworkVariantsStale(publication.id, publication.contentVersion, trx)
      await markPublicationTranslationsStale(publication.id, publication.contentVersion, trx)
      generation.useTransaction(trx)
      generation.appliedVariantId = variant.id
      generation.appliedAt = DateTime.utc()
      await generation.save()
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetPublicationId: publication.id,
          targetProjectId: publication.projectId,
          action: 'ai.variant_applied',
          previousValues: {
            contentVersion: payload.contentVersion,
            textLength: previous.baseText.length,
          },
          nextValues: {
            generationId: generation.id,
            variantId: variant.id,
            contentVersion: publication.contentVersion,
            textLength: variant.text.length,
          },
        },
        { client: trx }
      )
    })
    logger.info({
      event: 'ai.variant_applied',
      actorId: actor.id,
      publicationId: publication.id,
      generationId: generation.id,
      variantId: variant.id,
    })
    return response.ok({
      data: {
        generation: toAiGenerationView(generation),
        publication: toPublicationView(publication),
      },
    })
  }

  async cancel({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(aiGenerationParamsValidator)
    const found = await accessibleGeneration(actor, params.id)
    if (!found) return response.notFound(notFound)
    if (found.generation.status === 'cancelled') {
      return response.ok({ data: toAiGenerationView(found.generation) })
    }
    if (found.generation.status !== 'queued') {
      return response.conflict({
        errors: [{ message: 'Seule une génération en attente peut être annulée.' }],
      })
    }
    found.generation.status = 'cancelled'
    found.generation.cancelledAt = DateTime.utc()
    await found.generation.save()
    await AuditLog.create({
      actorUserId: actor.id,
      targetPublicationId: found.publication.id,
      targetProjectId: found.publication.projectId,
      action: 'ai.generation_cancelled',
      previousValues: { status: 'queued' },
      nextValues: { status: 'cancelled', generationId: found.generation.id },
    })
    logger.info({
      event: 'ai.generation_cancelled',
      actorId: actor.id,
      generationId: found.generation.id,
    })
    return response.ok({ data: toAiGenerationView(found.generation) })
  }
}
