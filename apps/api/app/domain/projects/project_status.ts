export const PROJECT_STATUSES = ['active', 'archived'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export function canAcceptPublications(status: ProjectStatus): boolean {
  return status === 'active'
}

export function archiveProject(currentStatus: ProjectStatus): {
  status: ProjectStatus
  changed: boolean
} {
  return { status: 'archived', changed: currentStatus !== 'archived' }
}

export function restoreProject(currentStatus: ProjectStatus): {
  status: ProjectStatus
  changed: boolean
} {
  return { status: 'active', changed: currentStatus !== 'active' }
}
