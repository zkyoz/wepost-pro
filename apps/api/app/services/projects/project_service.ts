import Project from '#models/project'
import ProjectMember from '#models/project_member'
import User from '#models/user'
import { canAcceptPublications } from '#domain/projects/project_status'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export class InvalidProjectAssignmentError extends Error {}

export type ProjectMemberView = {
  id: string
  displayName: string
  email: string
}

export type ProjectView = {
  id: string
  agencyId: string
  name: string
  description: string
  status: Project['status']
  clientUserId: string
  timezone: string
  createdBy: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  canAcceptPublications: boolean
  members: ProjectMemberView[]
}

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('fr-FR', { timeZone: timezone }).format()
    return true
  } catch {
    return false
  }
}

export function scopedProjectQuery(user: User): ModelQueryBuilderContract<typeof Project, Project> {
  const query = Project.query()
  if (user.role === 'admin') return query
  if (!user.agencyId) return query.whereRaw('1 = 0')

  query.where('agencyId', user.agencyId)
  if (user.role === 'client') {
    query.whereExists((memberQuery) => {
      memberQuery
        .from('project_members')
        .whereColumn('project_members.project_id', 'projects.id')
        .where('project_members.user_id', user.id)
    })
  }
  return query
}

export async function findAccessibleProject(user: User, id: string): Promise<Project | null> {
  return scopedProjectQuery(user).where('projects.id', id).first()
}

export async function resolveProjectMembers(
  actor: User,
  clientUserId: string,
  requestedMemberIds: readonly string[] = []
): Promise<{ agencyId: string; members: User[] }> {
  const ids = [...new Set([clientUserId, ...requestedMemberIds])]
  const members = await User.query().whereIn('id', ids)
  const primary = members.find((user) => user.id === clientUserId)

  if (!primary?.agencyId || primary.role !== 'client' || !primary.isActive) {
    throw new InvalidProjectAssignmentError('Client principal invalide.')
  }
  if (actor.role === 'agency' && actor.agencyId !== primary.agencyId) {
    throw new InvalidProjectAssignmentError('Client principal invalide.')
  }
  if (
    members.length !== ids.length ||
    members.some(
      (member) =>
        member.role !== 'client' || !member.isActive || member.agencyId !== primary.agencyId
    )
  ) {
    throw new InvalidProjectAssignmentError('Un ou plusieurs membres sont invalides.')
  }

  return { agencyId: primary.agencyId, members }
}

export async function toProjectViews(projects: readonly Project[]): Promise<ProjectView[]> {
  if (projects.length === 0) return []
  const projectIds = projects.map((project) => project.id)
  const memberships = await ProjectMember.query().whereIn('projectId', projectIds)
  const userIds = [...new Set(memberships.map((membership) => membership.userId))]
  const users = userIds.length > 0 ? await User.query().whereIn('id', userIds) : []
  const usersById = new Map(users.map((user) => [user.id, user]))
  const membersByProject = new Map<string, ProjectMemberView[]>()

  for (const membership of memberships) {
    const user = usersById.get(membership.userId)
    if (!user) continue
    const members = membersByProject.get(membership.projectId) ?? []
    members.push({ id: user.id, displayName: user.displayName, email: user.email })
    membersByProject.set(membership.projectId, members)
  }

  return projects.map((project) => ({
    id: project.id,
    agencyId: project.agencyId,
    name: project.name,
    description: project.description,
    status: project.status,
    clientUserId: project.clientUserId,
    timezone: project.timezone,
    createdBy: project.createdBy,
    createdAt: project.createdAt.toUTC().toISO()!,
    updatedAt: project.updatedAt.toUTC().toISO()!,
    archivedAt: project.archivedAt?.toUTC().toISO() ?? null,
    canAcceptPublications: canAcceptPublications(project.status),
    members: membersByProject.get(project.id) ?? [],
  }))
}
