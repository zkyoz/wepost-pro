export const PUBLICATION_STATUSES = [
  'draft',
  'in_progress',
  'awaiting_client_review',
  'changes_requested',
  'approved',
  'scheduled',
  'publishing',
  'published',
  'failed',
  'archived',
] as const

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number]

export const SOCIAL_NETWORKS = ['facebook', 'instagram', 'linkedin', 'pinterest', 'tiktok'] as const
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number]

const transitions: Record<PublicationStatus, readonly PublicationStatus[]> = {
  draft: ['in_progress', 'archived'],
  in_progress: ['awaiting_client_review', 'archived'],
  awaiting_client_review: ['changes_requested', 'approved', 'in_progress', 'archived'],
  changes_requested: ['in_progress', 'archived'],
  approved: ['scheduled', 'in_progress', 'archived'],
  scheduled: ['publishing', 'in_progress', 'archived'],
  publishing: ['published', 'failed'],
  published: ['archived'],
  failed: ['scheduled', 'in_progress', 'archived'],
  archived: [],
}

export function canTransition(from: PublicationStatus, to: PublicationStatus) {
  return transitions[from].includes(to)
}

export function transitionPublication(
  current: { status: PublicationStatus; contentVersion: number; approvedVersion: number | null },
  nextStatus: PublicationStatus
) {
  if (!canTransition(current.status, nextStatus)) {
    throw new Error(`Transition interdite : ${current.status} → ${nextStatus}`)
  }
  return {
    status: nextStatus,
    approvedVersion:
      nextStatus === 'approved'
        ? current.contentVersion
        : nextStatus === 'in_progress'
          ? null
          : current.approvedVersion,
  }
}

export function applyContentChange(current: {
  status: PublicationStatus
  contentVersion: number
  approvedVersion: number | null
}) {
  const approvalInvalidated = current.approvedVersion !== null
  return {
    contentVersion: current.contentVersion + 1,
    approvedVersion: approvalInvalidated ? null : current.approvedVersion,
    status: approvalInvalidated ? ('in_progress' as const) : current.status,
  }
}

export function assertCurrentVersion(expected: number, current: number) {
  if (expected !== current) {
    throw new PublicationVersionConflictError(current)
  }
}

export class PublicationVersionConflictError extends Error {
  constructor(public currentVersion: number) {
    super('La publication a été modifiée dans une autre session.')
  }
}

export function canEditPublication(status: PublicationStatus) {
  return !['publishing', 'published', 'archived'].includes(status)
}
