import type User from '#models/user'

export type ProjectAccessContext = {
  agencyId: string
  memberUserIds: readonly string[]
}

export function canAccessProject(user: User, project: ProjectAccessContext): boolean {
  if (user.role === 'admin') return true
  if (!user.agencyId || user.agencyId !== project.agencyId) return false
  if (user.role === 'agency') return true
  return user.role === 'client' && project.memberUserIds.includes(user.id)
}

export function canViewUser(actor: User, target: User): boolean {
  if (actor.role === 'admin' || actor.id === target.id) return true
  return Boolean(actor.role === 'agency' && actor.agencyId && actor.agencyId === target.agencyId)
}
