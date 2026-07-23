import Notification from '#models/notification'
import type Publication from '#models/publication'
import User from '#models/user'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import db from '@adonisjs/lucid/services/db'

export const NOTIFICATION_TYPES = [
  'publication.comment_created',
  'publication.review_approved',
  'publication.review_changes_requested',
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]
export type EmailDeliveryStatus = 'pending' | 'sent' | 'failed'
export type NotificationPayload = {
  publicationId: string
  projectId: string
}

export async function resolveNotificationRecipients(actor: User, publication: Publication) {
  let query = User.query().where('isActive', true).whereNot('id', actor.id)
  if (actor.role === 'client') {
    query = query.where('agencyId', publication.agencyId).where('role', 'agency')
  } else {
    query = query.whereIn(
      'id',
      db.from('project_members').select('user_id').where('project_id', publication.projectId)
    )
  }
  return query
}

export async function createNotifications(
  recipients: readonly User[],
  type: NotificationType,
  payload: NotificationPayload,
  trx: TransactionClientContract
) {
  if (recipients.length === 0) return []
  return Notification.createMany(
    recipients.map((recipient) => ({
      userId: recipient.id,
      type,
      payloadJson: payload,
      readAt: null,
      emailStatus: 'pending' as const,
      emailJobId: null,
      emailAttempts: 0,
      emailLastError: null,
      emailedAt: null,
    })),
    { client: trx }
  )
}
