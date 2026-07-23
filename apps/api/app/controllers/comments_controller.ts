import { canEditOwnComment } from '#domain/collaboration/review'
import AuditLog from '#models/audit_log'
import Comment from '#models/comment'
import { toCommentView } from '#services/collaboration/discussion_service'
import { dispatchNotificationEmails } from '#services/notifications/email_queue'
import {
  createNotifications,
  resolveNotificationRecipients,
} from '#services/notifications/notification_service'
import { findAccessiblePublication } from '#services/publications/publication_service'
import env from '#start/env'
import {
  createCommentValidator,
  publicationDiscussionValidator,
  updateCommentValidator,
} from '#validators/collaboration_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const notFound = { errors: [{ message: 'Commentaire introuvable.' }] }
const publicationNotFound = { errors: [{ message: 'Publication introuvable.' }] }

async function accessibleComment(actor: HttpContext['auth']['user'], id: string) {
  const comment = await Comment.find(id)
  if (!comment || !actor) return null
  const publication = await findAccessiblePublication(actor, comment.publicationId)
  return publication ? { comment, publication } : null
}

function canEdit(comment: Comment, actorId: string) {
  return canEditOwnComment(
    comment.authorId,
    actorId,
    comment.createdAt.toMillis(),
    Date.now(),
    env.get('COMMENT_EDIT_WINDOW_MINUTES')
  )
}

export default class CommentsController {
  async store({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createCommentValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(publicationNotFound)
    if (publication.status === 'archived') {
      return response.conflict({ errors: [{ message: 'Cette publication est archivée.' }] })
    }
    const recipients = await resolveNotificationRecipients(actor, publication)
    const result = await db.transaction(async (trx) => {
      const comment = await Comment.create(
        {
          publicationId: publication.id,
          authorId: actor.id,
          body: payload.body,
          editedAt: null,
          deletedAt: null,
        },
        { client: trx }
      )
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: publication.projectId,
          targetPublicationId: publication.id,
          action: 'comment.created',
          previousValues: {},
          nextValues: { commentId: comment.id, bodyLength: comment.body.length },
        },
        { client: trx }
      )
      const notifications = await createNotifications(
        recipients,
        'publication.comment_created',
        { publicationId: publication.id, projectId: publication.projectId },
        trx
      )
      return { comment, notifications }
    })
    await dispatchNotificationEmails(result.notifications, logger)
    logger.info({
      event: 'comment.created',
      commentId: result.comment.id,
      publicationId: publication.id,
      actorId: actor.id,
      emailJobs: result.notifications.length,
    })
    return response.created({ data: toCommentView(result.comment, actor, actor) })
  }

  async update({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(updateCommentValidator)
    const found = await accessibleComment(actor, payload.params.id)
    if (!found) return response.notFound(notFound)
    if (found.comment.deletedAt) {
      return response.conflict({ errors: [{ message: 'Ce commentaire a été supprimé.' }] })
    }
    if (!canEdit(found.comment, actor.id)) {
      return response.forbidden({
        errors: [{ message: 'La période de modification de ce commentaire est terminée.' }],
      })
    }
    const previousLength = found.comment.body.length
    await db.transaction(async (trx) => {
      found.comment.useTransaction(trx)
      found.comment.body = payload.body
      found.comment.editedAt = DateTime.utc()
      await found.comment.save()
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: found.publication.projectId,
          targetPublicationId: found.publication.id,
          action: 'comment.updated',
          previousValues: { commentId: found.comment.id, bodyLength: previousLength },
          nextValues: { commentId: found.comment.id, bodyLength: payload.body.length },
        },
        { client: trx }
      )
    })
    logger.info({ event: 'comment.updated', commentId: found.comment.id, actorId: actor.id })
    return response.ok({ data: toCommentView(found.comment, actor, actor) })
  }

  async destroy({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(publicationDiscussionValidator)
    const found = await accessibleComment(actor, params.id)
    if (!found) return response.notFound(notFound)
    if (found.comment.deletedAt) return response.noContent()
    const ownsEditableComment = canEdit(found.comment, actor.id)
    if (actor.role !== 'admin' && !ownsEditableComment) {
      return response.forbidden({ errors: [{ message: 'Suppression non autorisée.' }] })
    }
    const action =
      actor.role === 'admin' && found.comment.authorId !== actor.id
        ? 'comment.moderated'
        : 'comment.deleted'
    await db.transaction(async (trx) => {
      found.comment.useTransaction(trx)
      found.comment.deletedAt = DateTime.utc()
      await found.comment.save()
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: found.comment.authorId,
          targetProjectId: found.publication.projectId,
          targetPublicationId: found.publication.id,
          action,
          previousValues: { commentId: found.comment.id, deleted: false },
          nextValues: { commentId: found.comment.id, deleted: true },
        },
        { client: trx }
      )
    })
    logger.info({ event: action, commentId: found.comment.id, actorId: actor.id })
    return response.noContent()
  }
}
