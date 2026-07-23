import AuditLog from '#models/audit_log'
import PublicationTranslation from '#models/publication_translation'
import { AiProviderUnavailableError } from '#services/ai/ai_provider'
import {
  approvePublicationTranslation,
  generatePublicationTranslation,
  InvalidTranslationOutputError,
  savePublicationTranslation,
  toTranslationView,
  TranslationLocaleError,
  TranslationQuotaExceededError,
  TranslationVersionConflictError,
  translationErrorTotal,
} from '#services/i18n/translation_service'
import { findAccessiblePublication } from '#services/publications/publication_service'
import {
  approveTranslationValidator,
  createTranslationValidator,
  publicationTranslationsValidator,
  updateTranslationValidator,
} from '#validators/translation_validator'
import type { HttpContext } from '@adonisjs/core/http'

const notFound = { errors: [{ message: 'Traduction introuvable.' }] }

function translationError(error: unknown, response: HttpContext['response']) {
  if (error instanceof TranslationVersionConflictError) {
    return response.conflict({ errors: [{ message: error.message }] })
  }
  if (error instanceof TranslationLocaleError || error instanceof InvalidTranslationOutputError) {
    return response.unprocessableEntity({ errors: [{ message: error.message }] })
  }
  if (error instanceof TranslationQuotaExceededError) {
    return response.tooManyRequests({ errors: [{ message: 'Quota quotidien IA atteint.' }] })
  }
  if (error instanceof AiProviderUnavailableError) {
    return response.serviceUnavailable({
      errors: [{ message: 'Le fournisseur de traduction est indisponible.' }],
    })
  }
  throw error
}

export default class TranslationsController {
  async index({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(publicationTranslationsValidator)
    const publication = await findAccessiblePublication(actor, params.id)
    if (!publication) return response.notFound(notFound)
    const translations = await PublicationTranslation.query()
      .where('publicationId', publication.id)
      .orderBy('targetLocale')
      .orderBy('sourceVersion', 'desc')
    return response.ok({
      data: translations.map((item) => toTranslationView(item, publication)),
      meta: {
        sourceText: publication.baseText,
        sourceVersion: publication.contentVersion,
      },
    })
  }

  async generate({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createTranslationValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(notFound)
    try {
      const translation = await generatePublicationTranslation(actor, publication, payload)
      await AuditLog.create({
        actorUserId: actor.id,
        targetProjectId: publication.projectId,
        targetPublicationId: publication.id,
        action: 'publication.translation_generated',
        previousValues: {},
        nextValues: {
          translationId: translation.id,
          sourceLocale: translation.sourceLocale,
          targetLocale: translation.targetLocale,
          sourceVersion: translation.sourceVersion,
          provider: translation.provider,
          model: translation.model,
        },
      })
      logger.info({
        event: 'publication.translation_generated',
        metric: 'translation_generated_total',
        metricValue: 1,
        actorId: actor.id,
        publicationId: publication.id,
        targetLocale: translation.targetLocale,
      })
      return response.created({ data: toTranslationView(translation, publication) })
    } catch (error) {
      logger.warn({
        event: 'publication.translation_failed',
        metric: 'translation_error_total',
        metricValue: translationErrorTotal(),
        actorId: actor.id,
        publicationId: publication.id,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      return translationError(error, response)
    }
  }

  async update({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(updateTranslationValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(notFound)
    try {
      const translation = await savePublicationTranslation(actor, publication, {
        sourceLocale: payload.sourceLocale,
        targetLocale: payload.params.locale,
        sourceVersion: payload.sourceVersion,
        text: payload.text,
      })
      await AuditLog.create({
        actorUserId: actor.id,
        targetProjectId: publication.projectId,
        targetPublicationId: publication.id,
        action: 'publication.translation_updated',
        previousValues: {},
        nextValues: {
          translationId: translation.id,
          targetLocale: translation.targetLocale,
          sourceVersion: translation.sourceVersion,
          textLength: translation.text.length,
        },
      })
      logger.info({
        event: 'publication.translation_updated',
        actorId: actor.id,
        publicationId: publication.id,
        targetLocale: translation.targetLocale,
      })
      return response.ok({ data: toTranslationView(translation, publication) })
    } catch (error) {
      return translationError(error, response)
    }
  }

  async approve({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(approveTranslationValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(notFound)
    try {
      const translation = await approvePublicationTranslation(
        actor,
        publication,
        payload.params.locale,
        payload.sourceVersion
      )
      if (!translation) return response.notFound(notFound)
      await AuditLog.create({
        actorUserId: actor.id,
        targetProjectId: publication.projectId,
        targetPublicationId: publication.id,
        action: 'publication.translation_approved',
        previousValues: { status: 'draft' },
        nextValues: {
          translationId: translation.id,
          targetLocale: translation.targetLocale,
          sourceVersion: translation.sourceVersion,
        },
      })
      logger.info({
        event: 'publication.translation_approved',
        actorId: actor.id,
        publicationId: publication.id,
        targetLocale: translation.targetLocale,
      })
      return response.ok({ data: toTranslationView(translation, publication) })
    } catch (error) {
      return translationError(error, response)
    }
  }
}
