import {
  isAnnotationHistorical,
  validateAnnotationGeometry,
  type AnnotationGeometry,
} from '#domain/annotations/annotation_geometry'
import Annotation from '#models/annotation'
import Comment from '#models/comment'
import MediaAsset from '#models/media_asset'
import PublicationMedia from '#models/publication_media'
import User from '#models/user'
import { findAccessiblePublication } from '#services/publications/publication_service'

export type AnnotationView = {
  id: string
  publicationId: string
  mediaId: string
  mediaVersion: string
  commentId: string | null
  publicationVersion: number
  author: { id: string; displayName: string }
  shape: Annotation['shape']
  x: number
  y: number
  width: number | null
  height: number | null
  body: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  historical: boolean
  canEdit: boolean
  canDelete: boolean
}

export async function resolveAnnotationMedia(
  actor: User,
  publicationId: string,
  mediaId: string,
  requireAttached: boolean
) {
  const publication = await findAccessiblePublication(actor, publicationId)
  if (!publication) return null
  const media = await MediaAsset.query().where('id', mediaId).whereNull('deletedAt').first()
  if (!media) return null
  const attached = Boolean(
    await PublicationMedia.query()
      .where('publicationId', publication.id)
      .where('mediaId', media.id)
      .first()
  )
  if (requireAttached && !attached) return null
  if (!attached) {
    const historical = await Annotation.query()
      .where('publicationId', publication.id)
      .where('mediaId', media.id)
      .first()
    if (!historical) return null
  }
  return { publication, media, attached }
}

export async function resolveLinkedComment(publicationId: string, commentId?: string | null) {
  if (!commentId) return null
  return Comment.query()
    .where('id', commentId)
    .where('publicationId', publicationId)
    .whereNull('deletedAt')
    .first()
}

export async function findAccessibleAnnotation(actor: User, id: string) {
  const annotation = await Annotation.find(id)
  if (!annotation) return null
  const context = await resolveAnnotationMedia(
    actor,
    annotation.publicationId,
    annotation.mediaId,
    false
  )
  return context ? { annotation, ...context } : null
}

function permissions(annotation: Annotation, actor: User) {
  const mutable =
    !annotation.deletedAt && (annotation.authorId === actor.id || actor.role === 'admin')
  return { canEdit: mutable, canDelete: mutable }
}

export function toAnnotationView(input: {
  annotation: Annotation
  author: User
  actor: User
  media: MediaAsset
  currentVersion: number
  mediaCurrentlyAttached: boolean
}): AnnotationView {
  const { annotation } = input
  return {
    id: annotation.id,
    publicationId: annotation.publicationId,
    mediaId: annotation.mediaId,
    mediaVersion: input.media.checksum,
    commentId: annotation.commentId,
    publicationVersion: annotation.publicationVersion,
    author: { id: input.author.id, displayName: input.author.displayName },
    shape: annotation.shape,
    x: Number(annotation.x),
    y: Number(annotation.y),
    width: annotation.width === null ? null : Number(annotation.width),
    height: annotation.height === null ? null : Number(annotation.height),
    body: annotation.deletedAt ? null : annotation.body,
    createdAt: annotation.createdAt.toUTC().toISO()!,
    updatedAt: annotation.updatedAt.toUTC().toISO()!,
    deletedAt: annotation.deletedAt?.toUTC().toISO() ?? null,
    historical: isAnnotationHistorical({
      annotationVersion: annotation.publicationVersion,
      currentVersion: input.currentVersion,
      mediaCurrentlyAttached: input.mediaCurrentlyAttached,
    }),
    ...permissions(annotation, input.actor),
  }
}

export async function listAnnotationViews(input: {
  actor: User
  publicationId: string
  mediaId: string
  version?: number
}) {
  const context = await resolveAnnotationMedia(
    input.actor,
    input.publicationId,
    input.mediaId,
    false
  )
  if (!context) return null
  const query = Annotation.query()
    .where('publicationId', context.publication.id)
    .where('mediaId', context.media.id)
    .orderBy('createdAt', 'asc')
  if (input.version) query.where('publicationVersion', input.version)
  const annotations = await query
  const authors = annotations.length
    ? await User.query().whereIn('id', [...new Set(annotations.map((item) => item.authorId))])
    : []
  const authorsById = new Map(authors.map((author) => [author.id, author]))
  const data = annotations.flatMap((annotation) => {
    const author = authorsById.get(annotation.authorId)
    return author
      ? [
          toAnnotationView({
            annotation,
            author,
            actor: input.actor,
            media: context.media,
            currentVersion: context.publication.contentVersion,
            mediaCurrentlyAttached: context.attached,
          }),
        ]
      : []
  })
  return {
    context,
    data,
    meta: {
      currentPublicationVersion: context.publication.contentVersion,
      mediaVersion: context.media.checksum,
      mediaCurrentlyAttached: context.attached,
      openCount: data.filter((item) => !item.deletedAt && !item.historical).length,
    },
  }
}

export function checkedGeometry(input: AnnotationGeometry) {
  return validateAnnotationGeometry(input)
}
