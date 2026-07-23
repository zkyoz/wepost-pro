import { InvalidAnnotationGeometryError } from '#domain/annotations/annotation_geometry'
import Annotation from '#models/annotation'
import AuditLog from '#models/audit_log'
import User from '#models/user'
import {
  checkedGeometry,
  findAccessibleAnnotation,
  listAnnotationViews,
  resolveAnnotationMedia,
  resolveLinkedComment,
  toAnnotationView,
} from '#services/annotations/annotation_service'
import {
  annotationIdValidator,
  createAnnotationValidator,
  listAnnotationsValidator,
  updateAnnotationValidator,
} from '#validators/annotation_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const notFound = { errors: [{ message: 'Annotation introuvable.' }] }
const mediaNotFound = { errors: [{ message: 'Média introuvable.' }] }

function invalidGeometry(response: HttpContext['response'], error: unknown) {
  if (!(error instanceof InvalidAnnotationGeometryError)) throw error
  return response.unprocessableEntity({
    errors: [{ field: 'coordinates', message: error.message }],
  })
}

export default class AnnotationsController {
  async index({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(listAnnotationsValidator)
    const result = await listAnnotationViews({
      actor,
      publicationId: payload.params.publicationId,
      mediaId: payload.params.mediaId,
      version: payload.version,
    })
    if (!result) return response.notFound(mediaNotFound)
    logger.info({
      event: 'annotations.listed',
      publicationId: result.context.publication.id,
      mediaId: result.context.media.id,
      metric: 'annotation_open_total',
      metricValue: result.meta.openCount,
    })
    return response.ok({ data: result.data, meta: result.meta })
  }

  async store({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createAnnotationValidator)
    const context = await resolveAnnotationMedia(
      actor,
      payload.params.publicationId,
      payload.params.mediaId,
      true
    )
    if (!context) return response.notFound(mediaNotFound)
    if (context.publication.status === 'archived') {
      return response.conflict({ errors: [{ message: 'Cette publication est archivée.' }] })
    }
    const comment = await resolveLinkedComment(context.publication.id, payload.commentId)
    if (payload.commentId && !comment) {
      return response.unprocessableEntity({
        errors: [{ field: 'commentId', message: 'Le commentaire lié est invalide.' }],
      })
    }
    let geometry
    try {
      geometry = checkedGeometry(payload)
    } catch (error) {
      return invalidGeometry(response, error)
    }
    const annotation = await db.transaction(async (trx) => {
      const created = await Annotation.create(
        {
          publicationId: context.publication.id,
          mediaId: context.media.id,
          commentId: comment?.id ?? null,
          publicationVersion: context.publication.contentVersion,
          authorId: actor.id,
          ...geometry,
          body: payload.body,
          deletedAt: null,
        },
        { client: trx }
      )
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: context.publication.projectId,
          targetPublicationId: context.publication.id,
          targetMediaId: context.media.id,
          entityType: 'annotation',
          entityId: created.id,
          action: 'annotation.created',
          previousValues: {},
          nextValues: {
            shape: created.shape,
            publicationVersion: created.publicationVersion,
            bodyLength: created.body.length,
          },
          metadataJson: {},
        },
        { client: trx }
      )
      return created
    })
    logger.info({
      event: 'annotation.created',
      annotationId: annotation.id,
      publicationId: context.publication.id,
      mediaId: context.media.id,
      actorId: actor.id,
    })
    return response.created({
      data: toAnnotationView({
        annotation,
        author: actor,
        actor,
        media: context.media,
        currentVersion: context.publication.contentVersion,
        mediaCurrentlyAttached: true,
      }),
    })
  }

  async update({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(updateAnnotationValidator)
    const found = await findAccessibleAnnotation(actor, payload.params.id)
    if (!found) return response.notFound(notFound)
    if (found.annotation.deletedAt) {
      return response.conflict({ errors: [{ message: 'Cette annotation a été supprimée.' }] })
    }
    if (found.annotation.authorId !== actor.id && actor.role !== 'admin') {
      return response.forbidden({
        errors: [{ message: 'Seul l’auteur peut modifier cette annotation.' }],
      })
    }
    let geometry
    try {
      geometry = checkedGeometry(payload)
    } catch (error) {
      return invalidGeometry(response, error)
    }
    const previous = { shape: found.annotation.shape, bodyLength: found.annotation.body.length }
    await db.transaction(async (trx) => {
      found.annotation.useTransaction(trx)
      found.annotation.merge({ ...geometry, body: payload.body })
      await found.annotation.save()
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: found.annotation.authorId,
          targetProjectId: found.publication.projectId,
          targetPublicationId: found.publication.id,
          targetMediaId: found.media.id,
          entityType: 'annotation',
          entityId: found.annotation.id,
          action:
            actor.id === found.annotation.authorId ? 'annotation.updated' : 'annotation.moderated',
          previousValues: previous,
          nextValues: {
            shape: found.annotation.shape,
            bodyLength: found.annotation.body.length,
          },
          metadataJson: {},
        },
        { client: trx }
      )
    })
    const author = await User.findOrFail(found.annotation.authorId)
    logger.info({
      event: actor.id === found.annotation.authorId ? 'annotation.updated' : 'annotation.moderated',
      annotationId: found.annotation.id,
      actorId: actor.id,
    })
    return response.ok({
      data: toAnnotationView({
        annotation: found.annotation,
        author,
        actor,
        media: found.media,
        currentVersion: found.publication.contentVersion,
        mediaCurrentlyAttached: found.attached,
      }),
    })
  }

  async destroy({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(annotationIdValidator)
    const found = await findAccessibleAnnotation(actor, payload.params.id)
    if (!found) return response.notFound(notFound)
    if (found.annotation.deletedAt) return response.noContent()
    if (found.annotation.authorId !== actor.id && actor.role !== 'admin') {
      return response.forbidden({
        errors: [{ message: 'Seul l’auteur peut supprimer cette annotation.' }],
      })
    }
    const action =
      actor.id === found.annotation.authorId ? 'annotation.deleted' : 'annotation.moderated'
    await db.transaction(async (trx) => {
      found.annotation.useTransaction(trx)
      found.annotation.deletedAt = DateTime.utc()
      await found.annotation.save()
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: found.annotation.authorId,
          targetProjectId: found.publication.projectId,
          targetPublicationId: found.publication.id,
          targetMediaId: found.media.id,
          entityType: 'annotation',
          entityId: found.annotation.id,
          action,
          previousValues: { deleted: false },
          nextValues: { deleted: true },
          metadataJson: {},
        },
        { client: trx }
      )
    })
    logger.info({ event: action, annotationId: found.annotation.id, actorId: actor.id })
    return response.noContent()
  }
}
