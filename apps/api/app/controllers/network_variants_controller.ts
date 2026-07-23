import { canEditPublication } from '#domain/publications/publication_lifecycle'
import {
  NetworkVariantLengthError,
  validateNetworkVariantText,
} from '#domain/publications/network_variant'
import AuditLog from '#models/audit_log'
import PublicationNetworkVariant from '#models/publication_network_variant'
import { AiProviderUnavailableError } from '#services/ai/ai_provider'
import {
  effectiveNetworkText,
  generateNetworkVariantText,
  networkTextLimit,
  toNetworkVariantView,
} from '#services/publications/network_variant_service'
import { findAccessiblePublication } from '#services/publications/publication_service'
import {
  createNetworkVariantValidator,
  effectiveNetworkVariantValidator,
  generateNetworkVariantsValidator,
  publicationNetworkVariantParamsValidator,
  updateNetworkVariantValidator,
} from '#validators/network_variant_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

const notFound = { errors: [{ message: 'Variante réseau introuvable.' }] }

async function accessibleVariant(actor: HttpContext['auth']['user'], id: string) {
  if (!actor) return null
  const variant = await PublicationNetworkVariant.find(id)
  if (!variant) return null
  const publication = await findAccessiblePublication(actor, variant.publicationId)
  return publication ? { publication, variant } : null
}

function invalidText(error: unknown) {
  if (error instanceof NetworkVariantLengthError || error instanceof Error) {
    return { errors: [{ field: 'text', message: error.message }] }
  }
  return { errors: [{ field: 'text', message: 'Le texte est invalide.' }] }
}

export default class NetworkVariantsController {
  async index({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(publicationNetworkVariantParamsValidator)
    const publication = await findAccessiblePublication(actor, params.id)
    if (!publication) return response.notFound(notFound)
    const variants = await PublicationNetworkVariant.query()
      .where('publicationId', publication.id)
      .orderBy('network')
      .orderBy('sourceVersion', 'desc')
    return response.ok({
      data: variants.map((variant) => toNetworkVariantView(variant, publication.contentVersion)),
      meta: {
        sourceVersion: publication.contentVersion,
        sourceText: publication.baseText,
        limits: Object.fromEntries(
          publication.targetNetworks.map((network) => [network, networkTextLimit(network)])
        ),
      },
    })
  }

  async effective({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(effectiveNetworkVariantValidator)
    const publication = await findAccessiblePublication(actor, params.id)
    if (!publication) return response.notFound(notFound)
    return response.ok({ data: await effectiveNetworkText(publication, params.network) })
  }

  async store({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createNetworkVariantValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(notFound)
    if (!canEditPublication(publication.status)) {
      return response.conflict({
        errors: [{ message: 'La publication ne peut plus être modifiée.' }],
      })
    }
    try {
      const text = validateNetworkVariantText(payload.text, networkTextLimit(payload.network))
      const variant = await PublicationNetworkVariant.updateOrCreate(
        {
          publicationId: publication.id,
          network: payload.network,
          sourceVersion: publication.contentVersion,
        },
        {
          text,
          status: 'draft',
          generatedByAi: false,
          createdBy: actor.id,
          approvedBy: null,
          approvedAt: null,
          staleAt: null,
        }
      )
      await AuditLog.create({
        actorUserId: actor.id,
        targetProjectId: publication.projectId,
        targetPublicationId: publication.id,
        action: 'publication.network_variant_created',
        previousValues: {},
        nextValues: {
          variantId: variant.id,
          network: variant.network,
          sourceVersion: variant.sourceVersion,
        },
      })
      logger.info({
        event: 'publication.network_variant_created',
        actorId: actor.id,
        variantId: variant.id,
      })
      return response.created({ data: toNetworkVariantView(variant, publication.contentVersion) })
    } catch (error) {
      return response.unprocessableEntity(invalidText(error))
    }
  }

  async generate({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(generateNetworkVariantsValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(notFound)
    if (!canEditPublication(publication.status)) {
      return response.conflict({
        errors: [{ message: 'La publication ne peut plus être modifiée.' }],
      })
    }
    try {
      const generated = await Promise.all(
        payload.networks.map(async (network) => ({
          network,
          ...(await generateNetworkVariantText(publication, network, payload)),
        }))
      )
      const variants = await Promise.all(
        generated.map((item) =>
          PublicationNetworkVariant.updateOrCreate(
            {
              publicationId: publication.id,
              network: item.network,
              sourceVersion: publication.contentVersion,
            },
            {
              text: item.text,
              status: 'draft',
              generatedByAi: true,
              createdBy: actor.id,
              approvedBy: null,
              approvedAt: null,
              staleAt: null,
            }
          )
        )
      )
      await AuditLog.create({
        actorUserId: actor.id,
        targetProjectId: publication.projectId,
        targetPublicationId: publication.id,
        action: 'publication.network_variant_generated',
        previousValues: {},
        nextValues: {
          networks: generated.map((item) => item.network),
          provider: generated[0]?.provider,
          model: generated[0]?.model,
          sourceVersion: publication.contentVersion,
        },
      })
      logger.info({
        event: 'publication.network_variant_generated',
        metric: 'network_variant_generated_total',
        metricValue: variants.length,
        actorId: actor.id,
        publicationId: publication.id,
        networks: payload.networks,
      })
      return response.created({
        data: variants.map((variant) => toNetworkVariantView(variant, publication.contentVersion)),
      })
    } catch (error) {
      logger.warn({
        event: 'publication.network_variant_generation_failed',
        metric: 'network_variant_error_total',
        metricValue: 1,
        actorId: actor.id,
        publicationId: publication.id,
        networks: payload.networks,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      if (error instanceof AiProviderUnavailableError) {
        return response.serviceUnavailable({
          errors: [{ message: 'Le fournisseur IA est indisponible.' }],
        })
      }
      return response.unprocessableEntity(invalidText(error))
    }
  }

  async update({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(updateNetworkVariantValidator)
    const found = await accessibleVariant(actor, payload.params.id)
    if (!found) return response.notFound(notFound)
    const { publication, variant } = found
    if (variant.sourceVersion !== publication.contentVersion || variant.status === 'stale') {
      return response.conflict({
        errors: [{ message: 'Cette variante est obsolète. Régénérez-la depuis le texte actuel.' }],
      })
    }
    try {
      variant.text = validateNetworkVariantText(payload.text, networkTextLimit(variant.network))
      variant.status = 'draft'
      variant.approvedBy = null
      variant.approvedAt = null
      await variant.save()
      await AuditLog.create({
        actorUserId: actor.id,
        targetProjectId: publication.projectId,
        targetPublicationId: publication.id,
        action: 'publication.network_variant_updated',
        previousValues: {},
        nextValues: {
          variantId: variant.id,
          network: variant.network,
          sourceVersion: variant.sourceVersion,
        },
      })
      logger.info({
        event: 'publication.network_variant_updated',
        actorId: actor.id,
        variantId: variant.id,
      })
      return response.ok({ data: toNetworkVariantView(variant, publication.contentVersion) })
    } catch (error) {
      return response.unprocessableEntity(invalidText(error))
    }
  }

  async approve({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(publicationNetworkVariantParamsValidator)
    const found = await accessibleVariant(actor, params.id)
    if (!found) return response.notFound(notFound)
    const { publication, variant } = found
    if (actor.role === 'client' && publication.status !== 'awaiting_client_review') {
      return response.forbidden({
        errors: [{ message: 'La publication n’est pas en attente de validation client.' }],
      })
    }
    if (variant.sourceVersion !== publication.contentVersion || variant.status === 'stale') {
      return response.conflict({
        errors: [{ message: 'Une variante obsolète ne peut pas être approuvée.' }],
      })
    }
    variant.status = 'approved'
    variant.approvedBy = actor.id
    variant.approvedAt = DateTime.utc()
    await variant.save()
    await AuditLog.create({
      actorUserId: actor.id,
      targetProjectId: publication.projectId,
      targetPublicationId: publication.id,
      action: 'publication.network_variant_approved',
      previousValues: { status: 'draft' },
      nextValues: {
        variantId: variant.id,
        network: variant.network,
        sourceVersion: variant.sourceVersion,
      },
    })
    logger.info({
      event: 'publication.network_variant_approved',
      actorId: actor.id,
      variantId: variant.id,
    })
    return response.ok({ data: toNetworkVariantView(variant, publication.contentVersion) })
  }

  async stale({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(publicationNetworkVariantParamsValidator)
    const found = await accessibleVariant(actor, params.id)
    if (!found) return response.notFound(notFound)
    found.variant.status = 'stale'
    found.variant.staleAt = DateTime.utc()
    found.variant.approvedBy = null
    found.variant.approvedAt = null
    await found.variant.save()
    await AuditLog.create({
      actorUserId: actor.id,
      targetProjectId: found.publication.projectId,
      targetPublicationId: found.publication.id,
      action: 'publication.network_variant_stale',
      previousValues: {},
      nextValues: { variantId: found.variant.id, network: found.variant.network },
    })
    logger.info({
      event: 'publication.network_variant_stale',
      actorId: actor.id,
      variantId: found.variant.id,
    })
    return response.ok({
      data: toNetworkVariantView(found.variant, found.publication.contentVersion),
    })
  }
}
