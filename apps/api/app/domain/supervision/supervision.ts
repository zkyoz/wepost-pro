import { DateTime } from 'luxon'

export const SUPERVISION_CATEGORIES = [
  'unread_comments',
  'awaiting_client_review',
  'changes_requested',
  'scheduled',
  'published',
  'failed',
] as const

export type SupervisionCategory = (typeof SUPERVISION_CATEGORIES)[number]

export const SUPERVISION_STATUS_BY_CATEGORY = {
  awaiting_client_review: 'awaiting_client_review',
  changes_requested: 'changes_requested',
  scheduled: 'scheduled',
  published: 'published',
  failed: 'failed',
} as const satisfies Partial<Record<SupervisionCategory, string>>

export class InvalidSupervisionPeriodError extends Error {}

export function publicationStatusForCategory(category: SupervisionCategory) {
  return category === 'unread_comments' ? null : SUPERVISION_STATUS_BY_CATEGORY[category]
}

export function parseSupervisionPeriod(from?: string, to?: string) {
  const start = from ? DateTime.fromISO(from, { zone: 'utc' }).startOf('day') : null
  const end = to ? DateTime.fromISO(to, { zone: 'utc' }).endOf('day') : null
  if ((start && !start.isValid) || (end && !end.isValid)) {
    throw new InvalidSupervisionPeriodError('La période de supervision est invalide.')
  }
  if (start && end && (start > end || end.diff(start, 'days').days > 366)) {
    throw new InvalidSupervisionPeriodError('La période doit être ordonnée et limitée à 366 jours.')
  }
  return { from: start?.toSQL() ?? null, to: end?.toSQL() ?? null }
}

export function actionRequiredCount(counts: Record<SupervisionCategory, number>) {
  return (
    counts.unread_comments +
    counts.awaiting_client_review +
    counts.changes_requested +
    counts.failed
  )
}
