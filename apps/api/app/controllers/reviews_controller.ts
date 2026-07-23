import {
  InvalidReviewStateError,
  reviewPublication,
  StaleReviewError,
} from '#domain/collaboration/review'
import AuditLog from '#models/audit_log'
import PublicationReview from '#models/publication_review'
import { toReviewView } from '#services/collaboration/discussion_service'
import { dispatchNotificationEmails } from '#services/notifications/email_queue'
import {
  createNotifications,
  resolveNotificationRecipients,
} from '#services/notifications/notification_service'
import { findAccessiblePublication } from '#services/publications/publication_service'
import { createReviewValidator } from '#validators/collaboration_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

const notFound = { errors: [{ message: 'Publication introuvable.' }] }

export default class ReviewsController {
  async store({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createReviewValidator)
    if (actor.role !== 'client') {
      return response.forbidden({ errors: [{ message: 'Décision réservée au client.' }] })
    }
    if (payload.decision === 'changes_requested' && !payload.message) {
      return response.unprocessableEntity({
        errors: [{ field: 'message', message: 'Expliquez les corrections demandées.' }],
      })
    }
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(notFound)
    let next
    try {
      next = reviewPublication(publication, payload.contentVersion, payload.decision)
    } catch (error) {
      if (error instanceof StaleReviewError) {
        return response.conflict({
          errors: [{ message: error.message }],
          meta: { currentVersion: error.currentVersion },
        })
      }
      if (error instanceof InvalidReviewStateError) {
        return response.conflict({ errors: [{ message: error.message }] })
      }
      throw error
    }
    const existing = await PublicationReview.query()
      .where('publicationId', publication.id)
      .where('reviewerId', actor.id)
      .where('version', publication.contentVersion)
      .first()
    if (existing) {
      return response.conflict({ errors: [{ message: 'Cette version a déjà été évaluée.' }] })
    }
    const recipients = await resolveNotificationRecipients(actor, publication)
    const previousStatus = publication.status
    const result = await db.transaction(async (trx) => {
      const review = await PublicationReview.create(
        {
          publicationId: publication.id,
          reviewerId: actor.id,
          version: publication.contentVersion,
          decision: payload.decision,
          message: payload.message ?? null,
        },
        { client: trx }
      )
      publication.useTransaction(trx)
      publication.merge({ ...next, updatedBy: actor.id })
      await publication.save()
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: publication.projectId,
          targetPublicationId: publication.id,
          action: 'publication.reviewed',
          previousValues: { status: previousStatus, approvedVersion: null },
          nextValues: {
            status: publication.status,
            approvedVersion: publication.approvedVersion,
            decision: review.decision,
            version: review.version,
          },
        },
        { client: trx }
      )
      const type =
        payload.decision === 'approved'
          ? 'publication.review_approved'
          : 'publication.review_changes_requested'
      const notifications = await createNotifications(
        recipients,
        type,
        { publicationId: publication.id, projectId: publication.projectId },
        trx
      )
      return { review, notifications }
    })
    await dispatchNotificationEmails(result.notifications, logger)
    logger.info({
      event: 'publication.reviewed',
      publicationId: publication.id,
      actorId: actor.id,
      decision: payload.decision,
      version: publication.contentVersion,
      emailJobs: result.notifications.length,
    })
    return response.created({
      data: {
        review: toReviewView(result.review, actor),
        publication: {
          status: publication.status,
          contentVersion: publication.contentVersion,
          approvedVersion: publication.approvedVersion,
        },
      },
    })
  }
}
