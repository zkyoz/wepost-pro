import mediaConfig from '#config/media'
import {
  createStorageKey,
  InvalidMediaError,
  validateAlternative,
  validateMediaBuffer,
} from '#domain/media/media_validation'
import AuditLog from '#models/audit_log'
import MediaAsset from '#models/media_asset'
import PublicationMedia from '#models/publication_media'
import {
  compactMediaPositions,
  findManageableMedia,
  findReadableMedia,
  listPublicationMedia,
  toMediaView,
} from '#services/media/media_service'
import {
  getLocalObject,
  getMediaStorage,
  putLocalObject,
  verifyLocalToken,
} from '#services/media/media_storage'
import { findAccessiblePublication } from '#services/publications/publication_service'
import {
  attachMediaValidator,
  initializeMediaUploadValidator,
  mediaIdValidator,
  publicationMediaValidator,
  reorderMediaValidator,
  updateMediaValidator,
} from '#validators/media_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { createHash, randomUUID } from 'node:crypto'
import { basename } from 'node:path'
import { DateTime } from 'luxon'

const mediaNotFound = { errors: [{ message: 'Média introuvable.' }] }
const publicationNotFound = { errors: [{ message: 'Publication introuvable.' }] }

function safeOriginalName(value: string) {
  return [...basename(value)]
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0
      return code >= 32 && code !== 127
    })
    .join('')
}

async function requestBytes(request: HttpContext['request']) {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request.request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > mediaConfig.maxBytes)
      throw new InvalidMediaError('Le fichier dépasse la taille autorisée.', 'size_exceeded')
    chunks.push(buffer)
  }
  return Buffer.concat(chunks)
}

export default class MediaController {
  async localUpload({ logger, request, response }: HttpContext) {
    const token = String(request.qs().token ?? '')
    const key = verifyLocalToken(token, 'upload')
    if (!key)
      return response.unauthorized({ errors: [{ message: 'URL d’upload invalide ou expirée.' }] })
    const media = await MediaAsset.query()
      .where('storageKey', key)
      .where('scanStatus', 'pending_upload')
      .first()
    if (!media) return response.notFound(mediaNotFound)
    const contentType = request.header('content-type')?.split(';')[0]
    if (contentType !== media.mimeType)
      return response.unprocessableEntity({
        errors: [{ message: 'Le type envoyé ne correspond pas au type signé.' }],
      })
    try {
      const bytes = await requestBytes(request)
      putLocalObject(key, { bytes, contentType })
      const etag = `"${createHash('sha256').update(bytes).digest('hex')}"`
      response.header('ETag', etag)
      return response.noContent()
    } catch (error) {
      logger.warn({
        event: 'media.local_upload.failed',
        mediaId: media.id,
        reason: error instanceof InvalidMediaError ? error.code : 'unknown',
      })
      if (error instanceof InvalidMediaError)
        return response.status(413).send({ errors: [{ message: error.message }] })
      throw error
    }
  }

  async localRead({ request, response }: HttpContext) {
    const token = String(request.qs().token ?? '')
    const key = verifyLocalToken(token, 'read')
    if (!key)
      return response.unauthorized({ errors: [{ message: 'URL de lecture invalide ou expirée.' }] })
    const object = getLocalObject(key)
    if (!object) return response.notFound(mediaNotFound)
    response.header('Content-Type', object.contentType)
    response.header('Cache-Control', 'private, no-store')
    response.header('X-Content-Type-Options', 'nosniff')
    return response.send(object.bytes)
  }

  async initialize({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(initializeMediaUploadValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(publicationNotFound)
    if (!mediaConfig.allowedMimeTypes.includes(payload.declaredMimeType)) {
      return response.unprocessableEntity({
        errors: [{ field: 'file', message: 'Type de fichier non autorisé.' }],
      })
    }
    if (payload.sizeBytes > mediaConfig.maxBytes)
      return response
        .status(413)
        .send({ errors: [{ field: 'file', message: 'Le fichier dépasse la taille autorisée.' }] })
    try {
      validateAlternative({
        mimeType: payload.declaredMimeType,
        altText: payload.altText,
        isDecorative: payload.isDecorative ?? false,
      })
    } catch (error) {
      if (error instanceof InvalidMediaError)
        return response.unprocessableEntity({
          errors: [{ field: 'altText', message: error.message }],
        })
      throw error
    }
    const duplicate = await MediaAsset.query()
      .where('agencyId', publication.agencyId)
      .where('checksum', payload.checksum.toLowerCase())
      .where('scanStatus', 'clean')
      .whereNull('deletedAt')
      .first()
    if (duplicate)
      return response.conflict({
        errors: [{ message: 'Ce fichier existe déjà dans la médiathèque de l’agence.' }],
      })

    const id = randomUUID()
    const storageKey = createStorageKey({
      environment: mediaConfig.r2.environmentPrefix,
      agencyId: publication.agencyId,
      mediaId: id,
      mimeType: payload.declaredMimeType,
    })
    const media = await MediaAsset.create({
      id,
      agencyId: publication.agencyId,
      uploaderId: actor.id,
      storageKey,
      originalName: safeOriginalName(payload.originalName),
      mimeType: payload.declaredMimeType,
      sizeBytes: payload.sizeBytes,
      checksum: payload.checksum.toLowerCase(),
      width: null,
      height: null,
      durationMs: null,
      altText: payload.isDecorative ? null : (payload.altText ?? null),
      isDecorative: payload.isDecorative ?? false,
      scanStatus: 'pending_upload',
      uploadExpiresAt: DateTime.utc().plus({ minutes: mediaConfig.abandonedUploadMinutes }),
      deletedAt: null,
    })
    let upload
    try {
      upload = await getMediaStorage().signUpload(storageKey, media.mimeType)
    } catch (error) {
      await media.delete()
      logger.error({
        event: 'media.r2.sign_upload.failed',
        mediaId: id,
        error: error instanceof Error ? error.message : 'unknown',
      })
      return response.serviceUnavailable({
        errors: [{ message: 'Le stockage est temporairement indisponible.' }],
      })
    }
    await AuditLog.create({
      actorUserId: actor.id,
      targetUserId: null,
      targetProjectId: null,
      targetPublicationId: publication.id,
      targetMediaId: media.id,
      action: 'media.upload_initialized',
      previousValues: {},
      nextValues: { mimeType: media.mimeType, sizeBytes: Number(media.sizeBytes) },
    })
    logger.info({ event: 'media.upload_initialized', mediaId: media.id, actorId: actor.id })
    return response.created({ data: toMediaView(media), upload })
  }

  async finalize({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(mediaIdValidator)
    const media = await findManageableMedia(actor, params.id)
    if (!media || media.deletedAt) return response.notFound(mediaNotFound)
    if (media.scanStatus === 'clean') return response.ok({ data: toMediaView(media) })
    let object
    try {
      object = await getMediaStorage().read(media.storageKey)
    } catch (error) {
      logger.error({
        event: 'media.r2.read.failed',
        mediaId: media.id,
        error: error instanceof Error ? error.message : 'unknown',
      })
      return response.serviceUnavailable({
        errors: [{ message: 'Impossible de vérifier le fichier actuellement.' }],
      })
    }
    if (!object)
      return response.conflict({ errors: [{ message: 'L’upload n’est pas encore disponible.' }] })
    try {
      const validated = await validateMediaBuffer({
        bytes: object.bytes,
        declaredMimeType: media.mimeType,
        expectedSize: Number(media.sizeBytes),
        expectedChecksum: media.checksum,
        allowedMimeTypes: mediaConfig.allowedMimeTypes,
        maxBytes: mediaConfig.maxBytes,
      })
      const duplicate = await MediaAsset.query()
        .where('agencyId', media.agencyId)
        .where('checksum', validated.checksum)
        .where('scanStatus', 'clean')
        .whereNull('deletedAt')
        .whereNot('id', media.id)
        .first()
      if (duplicate)
        throw new InvalidMediaError(
          'Ce fichier existe déjà dans la médiathèque de l’agence.',
          'checksum_mismatch'
        )
      media.merge({
        mimeType: validated.mimeType,
        sizeBytes: object.bytes.length,
        checksum: validated.checksum,
        width: validated.width,
        height: validated.height,
        durationMs: validated.durationMs,
        scanStatus: 'clean',
      })
      await media.save()
    } catch (error) {
      media.scanStatus = 'rejected'
      await media.save()
      await getMediaStorage().delete(media.storageKey)
      logger.warn({
        event: 'media.validation.failed',
        mediaId: media.id,
        reason: error instanceof InvalidMediaError ? error.code : 'unknown',
      })
      return response.unprocessableEntity({
        errors: [
          { field: 'file', message: error instanceof Error ? error.message : 'Fichier invalide.' },
        ],
      })
    }
    await AuditLog.create({
      actorUserId: actor.id,
      targetUserId: null,
      targetProjectId: null,
      targetPublicationId: null,
      targetMediaId: media.id,
      action: 'media.upload_finalized',
      previousValues: { scanStatus: 'pending_upload' },
      nextValues: {
        scanStatus: 'clean',
        mimeType: media.mimeType,
        sizeBytes: Number(media.sizeBytes),
      },
    })
    logger.info({ event: 'media.upload_finalized', mediaId: media.id, actorId: actor.id })
    return response.ok({ data: toMediaView(media) })
  }

  async index({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(mediaIdValidator)
    const result = await listPublicationMedia(actor, params.id)
    if (!result) return response.notFound(publicationNotFound)
    const storageBytes = result.data.reduce((total, media) => total + media.sizeBytes, 0)
    const agencyStorage = await MediaAsset.query()
      .where('agencyId', result.publication.agencyId)
      .where('scanStatus', 'clean')
      .whereNull('deletedAt')
      .sum('size_bytes as total')
      .first()
    const agencyStorageBytes = Number(agencyStorage?.$extras.total ?? 0)
    logger.info({
      event: 'media.storage.measured',
      publicationId: result.publication.id,
      storageBytes,
      agencyStorageBytes,
    })
    if (agencyStorageBytes >= mediaConfig.agencyQuotaBytes * 0.9)
      logger.warn({
        event: 'media.quota.warning',
        agencyId: result.publication.agencyId,
        agencyStorageBytes,
        quotaBytes: mediaConfig.agencyQuotaBytes,
      })
    return response.ok({
      data: result.data,
      meta: { storageBytes, agencyStorageBytes, quotaBytes: mediaConfig.agencyQuotaBytes },
    })
  }

  async attach({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(attachMediaValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    const media = await findManageableMedia(actor, payload.mediaId)
    if (!publication || !media || media.deletedAt || publication.agencyId !== media.agencyId)
      return response.notFound(mediaNotFound)
    if (media.scanStatus !== 'clean')
      return response.conflict({
        errors: [{ message: 'Le média doit être validé avant son association.' }],
      })
    try {
      validateAlternative(media)
    } catch (error) {
      if (error instanceof InvalidMediaError)
        return response.unprocessableEntity({
          errors: [{ field: 'altText', message: error.message }],
        })
      throw error
    }
    const exists = await PublicationMedia.query()
      .where('publicationId', publication.id)
      .where('mediaId', media.id)
      .first()
    if (!exists) {
      const position = await PublicationMedia.query()
        .where('publicationId', publication.id)
        .max('position as max')
        .first()
      await PublicationMedia.create({
        publicationId: publication.id,
        mediaId: media.id,
        position: Number(position?.$extras.max ?? -1) + 1,
      })
      await AuditLog.create({
        actorUserId: actor.id,
        targetUserId: null,
        targetProjectId: publication.projectId,
        targetPublicationId: publication.id,
        targetMediaId: media.id,
        action: 'media.attached',
        previousValues: {},
        nextValues: { position: Number(position?.$extras.max ?? -1) + 1 },
      })
    }
    return response.created({ data: toMediaView(media) })
  }

  async update({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(updateMediaValidator)
    const media = await findManageableMedia(actor, payload.params.id)
    if (!media || media.deletedAt) return response.notFound(mediaNotFound)
    try {
      validateAlternative({
        mimeType: media.mimeType,
        altText: payload.altText,
        isDecorative: payload.isDecorative,
      })
    } catch (error) {
      if (error instanceof InvalidMediaError)
        return response.unprocessableEntity({
          errors: [{ field: 'altText', message: error.message }],
        })
      throw error
    }
    const previous = { altText: media.altText, isDecorative: media.isDecorative }
    media.altText = payload.isDecorative ? null : (payload.altText ?? null)
    media.isDecorative = payload.isDecorative
    await media.save()
    await AuditLog.create({
      actorUserId: actor.id,
      targetUserId: null,
      targetProjectId: null,
      targetPublicationId: null,
      targetMediaId: media.id,
      action: 'media.updated',
      previousValues: previous,
      nextValues: { altText: media.altText, isDecorative: media.isDecorative },
    })
    return response.ok({ data: toMediaView(media) })
  }

  async reorder({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(reorderMediaValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(publicationNotFound)
    const current = await PublicationMedia.query().where('publicationId', publication.id)
    if (
      current.length !== payload.mediaIds.length ||
      current.some((link) => !payload.mediaIds.includes(link.mediaId))
    )
      return response.unprocessableEntity({
        errors: [{ message: 'La liste doit contenir exactement les médias associés.' }],
      })
    await db.transaction(async (trx) => {
      for (const [index, mediaId] of payload.mediaIds.entries())
        await trx
          .from('publication_media')
          .where('publication_id', publication.id)
          .where('media_id', mediaId)
          .update({ position: payload.mediaIds.length + index })
      for (const [index, mediaId] of payload.mediaIds.entries())
        await trx
          .from('publication_media')
          .where('publication_id', publication.id)
          .where('media_id', mediaId)
          .update({ position: index })
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: publication.projectId,
          targetPublicationId: publication.id,
          targetMediaId: null,
          action: 'media.reordered',
          previousValues: {
            mediaIds: current.sort((a, b) => a.position - b.position).map((link) => link.mediaId),
          },
          nextValues: { mediaIds: payload.mediaIds },
        },
        { client: trx }
      )
    })
    return response.ok({ data: payload.mediaIds })
  }

  async detach({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(publicationMediaValidator)
    const publication = await findAccessiblePublication(actor, params.id)
    const media = await findManageableMedia(actor, params.mediaId)
    if (!publication || !media) return response.notFound(mediaNotFound)
    await PublicationMedia.query()
      .where('publicationId', publication.id)
      .where('mediaId', media.id)
      .delete()
    await compactMediaPositions(publication.id)
    await AuditLog.create({
      actorUserId: actor.id,
      targetUserId: null,
      targetProjectId: publication.projectId,
      targetPublicationId: publication.id,
      targetMediaId: media.id,
      action: 'media.detached',
      previousValues: { attached: true },
      nextValues: { attached: false },
    })
    return response.noContent()
  }

  async destroy({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(mediaIdValidator)
    const media = await findManageableMedia(actor, params.id)
    if (!media) return response.notFound(mediaNotFound)
    if (!media.deletedAt) {
      const attachedMedia = await PublicationMedia.query().where('mediaId', media.id)
      const publicationIds = attachedMedia.map((link) => link.publicationId)
      media.deletedAt = DateTime.utc()
      await media.save()
      await PublicationMedia.query().where('mediaId', media.id).delete()
      for (const publicationId of publicationIds) {
        await compactMediaPositions(publicationId)
      }
      await AuditLog.create({
        actorUserId: actor.id,
        targetUserId: null,
        targetProjectId: null,
        targetPublicationId: null,
        targetMediaId: media.id,
        action: 'media.deleted',
        previousValues: { deletedAt: null },
        nextValues: { deletedAt: media.deletedAt.toISO() },
      })
    }
    return response.ok({ data: toMediaView(media) })
  }

  async purge({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(mediaIdValidator)
    const media = await findManageableMedia(actor, params.id)
    if (!media) return response.notFound(mediaNotFound)
    if (!media.deletedAt)
      return response.conflict({
        errors: [{ message: 'Le média doit être supprimé logiquement avant sa purge.' }],
      })
    await getMediaStorage().delete(media.storageKey)
    await db.transaction(async (trx) => {
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: null,
          targetPublicationId: null,
          targetMediaId: media.id,
          action: 'media.purged',
          previousValues: { mediaId: media.id, storageKey: media.storageKey },
          nextValues: { purged: true },
        },
        { client: trx }
      )
      media.useTransaction(trx)
      await media.delete()
    })
    logger.info({ event: 'media.purged', mediaId: params.id, actorId: actor.id })
    return response.noContent()
  }

  async readUrl({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(mediaIdValidator)
    const media = await findReadableMedia(actor, params.id)
    if (!media || media.scanStatus !== 'clean') return response.notFound(mediaNotFound)
    return response.ok({ data: await getMediaStorage().signRead(media.storageKey) })
  }
}
