import { canEditOwnComment } from '#domain/collaboration/review'
import Annotation from '#models/annotation'
import Comment from '#models/comment'
import PublicationReview from '#models/publication_review'
import User from '#models/user'
import env from '#start/env'

export type CommentView = {
  id: string
  publicationId: string
  author: { id: string; displayName: string }
  body: string | null
  createdAt: string
  editedAt: string | null
  deletedAt: string | null
  canEdit: boolean
  canDelete: boolean
  annotationIds: string[]
}

export type ReviewView = {
  id: string
  publicationId: string
  reviewer: { id: string; displayName: string }
  version: number
  decision: PublicationReview['decision']
  message: string | null
  createdAt: string
}

function editable(comment: Comment, actor: User) {
  if (comment.deletedAt) return false
  return canEditOwnComment(
    comment.authorId,
    actor.id,
    comment.createdAt.toMillis(),
    Date.now(),
    env.get('COMMENT_EDIT_WINDOW_MINUTES')
  )
}

export function toCommentView(
  comment: Comment,
  author: User,
  actor: User,
  annotationIds: string[] = []
): CommentView {
  const canEdit = editable(comment, actor)
  return {
    id: comment.id,
    publicationId: comment.publicationId,
    author: { id: author.id, displayName: author.displayName },
    body: comment.deletedAt ? null : comment.body,
    createdAt: comment.createdAt.toUTC().toISO()!,
    editedAt: comment.editedAt?.toUTC().toISO() ?? null,
    deletedAt: comment.deletedAt?.toUTC().toISO() ?? null,
    canEdit,
    canDelete: actor.role === 'admin' || canEdit,
    annotationIds,
  }
}

export function toReviewView(review: PublicationReview, reviewer: User): ReviewView {
  return {
    id: review.id,
    publicationId: review.publicationId,
    reviewer: { id: reviewer.id, displayName: reviewer.displayName },
    version: review.version,
    decision: review.decision,
    message: review.message,
    createdAt: review.createdAt.toUTC().toISO()!,
  }
}

export async function discussionView(publicationId: string, actor: User) {
  const [comments, reviews, annotations] = await Promise.all([
    Comment.query().where('publicationId', publicationId).orderBy('createdAt', 'asc'),
    PublicationReview.query().where('publicationId', publicationId).orderBy('createdAt', 'desc'),
    Annotation.query()
      .where('publicationId', publicationId)
      .whereNotNull('commentId')
      .whereNull('deletedAt'),
  ])
  const userIds = [
    ...new Set([
      ...comments.map((comment) => comment.authorId),
      ...reviews.map((review) => review.reviewerId),
    ]),
  ]
  const users = userIds.length ? await User.query().whereIn('id', userIds) : []
  const byId = new Map(users.map((user) => [user.id, user]))
  const annotationsByComment = new Map<string, string[]>()
  for (const annotation of annotations) {
    if (!annotation.commentId) continue
    const ids = annotationsByComment.get(annotation.commentId) ?? []
    ids.push(annotation.id)
    annotationsByComment.set(annotation.commentId, ids)
  }
  return {
    comments: comments.flatMap((comment) => {
      const author = byId.get(comment.authorId)
      return author
        ? [toCommentView(comment, author, actor, annotationsByComment.get(comment.id) ?? [])]
        : []
    }),
    reviews: reviews.flatMap((review) => {
      const reviewer = byId.get(review.reviewerId)
      return reviewer ? [toReviewView(review, reviewer)] : []
    }),
  }
}
