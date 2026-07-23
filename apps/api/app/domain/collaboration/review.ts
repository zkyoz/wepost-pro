import type { PublicationStatus } from '#domain/publications/publication_lifecycle'

export const REVIEW_DECISIONS = ['approved', 'changes_requested'] as const
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number]

export class StaleReviewError extends Error {
  constructor(public currentVersion: number) {
    super('La publication a changé depuis l’ouverture de la page.')
  }
}

export class InvalidReviewStateError extends Error {
  constructor() {
    super('Cette publication n’est pas en attente de validation.')
  }
}

export function reviewPublication(
  current: {
    status: PublicationStatus
    contentVersion: number
    approvedVersion: number | null
  },
  expectedVersion: number,
  decision: ReviewDecision
) {
  if (expectedVersion !== current.contentVersion) {
    throw new StaleReviewError(current.contentVersion)
  }
  if (current.status !== 'awaiting_client_review') throw new InvalidReviewStateError()
  return {
    status: decision,
    approvedVersion: decision === 'approved' ? current.contentVersion : null,
  } as const
}

export function canEditOwnComment(
  authorId: string,
  actorId: string,
  createdAtMillis: number,
  nowMillis: number,
  editWindowMinutes: number
) {
  return authorId === actorId && nowMillis - createdAtMillis <= editWindowMinutes * 60_000
}
