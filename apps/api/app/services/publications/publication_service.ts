import type { SocialNetwork } from '#domain/publications/publication_lifecycle'
import Publication from '#models/publication'
import type PublicationVersion from '#models/publication_version'
import type { PublicationSnapshot } from '#models/publication_version'
import type User from '#models/user'
import { findAccessibleProject } from '#services/projects/project_service'

export type PublicationView = {
  id: string
  agencyId: string
  projectId: string
  title: string
  baseText: string
  status: Publication['status']
  targetNetworks: SocialNetwork[]
  scheduledAt: string | null
  timezone: string
  contentVersion: number
  approvedVersion: number | null
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  versions?: Array<{
    version: number
    snapshot: PublicationSnapshot
    authorId: string
    createdAt: string
  }>
}

export function publicationSnapshot(publication: Publication): PublicationSnapshot {
  return {
    title: publication.title,
    baseText: publication.baseText,
    status: publication.status,
    targetNetworks: publication.targetNetworks,
    scheduledAt: publication.scheduledAt?.toUTC().toISO() ?? null,
    timezone: publication.timezone,
  }
}

export async function findAccessiblePublication(actor: User, id: string) {
  const publication = await Publication.find(id)
  if (!publication) return null
  const project = await findAccessibleProject(actor, publication.projectId)
  return project ? publication : null
}

export function toPublicationView(
  publication: Publication,
  versions?: readonly PublicationVersion[]
): PublicationView {
  return {
    id: publication.id,
    agencyId: publication.agencyId,
    projectId: publication.projectId,
    title: publication.title,
    baseText: publication.baseText,
    status: publication.status,
    targetNetworks: publication.targetNetworks,
    scheduledAt: publication.scheduledAt?.toUTC().toISO() ?? null,
    timezone: publication.timezone,
    contentVersion: publication.contentVersion,
    approvedVersion: publication.approvedVersion,
    createdBy: publication.createdBy,
    updatedBy: publication.updatedBy,
    createdAt: publication.createdAt.toUTC().toISO()!,
    updatedAt: publication.updatedAt.toUTC().toISO()!,
    archivedAt: publication.archivedAt?.toUTC().toISO() ?? null,
    ...(versions
      ? {
          versions: versions.map((version) => ({
            version: version.version,
            snapshot: version.snapshotJson,
            authorId: version.authorId,
            createdAt: version.createdAt.toUTC().toISO()!,
          })),
        }
      : {}),
  }
}
