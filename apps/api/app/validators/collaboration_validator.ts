import { REVIEW_DECISIONS } from '#domain/collaboration/review'
import vine from '@vinejs/vine'

const id = vine.string().uuid()
const body = vine.string().trim().minLength(1).maxLength(5000)

export const publicationDiscussionValidator = vine.compile(
  vine.object({ params: vine.object({ id }) })
)

export const createCommentValidator = vine.compile(
  vine.object({ params: vine.object({ id }), body })
)

export const updateCommentValidator = vine.compile(
  vine.object({ params: vine.object({ id }), body })
)

export const createReviewValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    contentVersion: vine.number().min(1),
    decision: vine.enum(REVIEW_DECISIONS),
    message: vine.string().trim().maxLength(5000).nullable().optional(),
  })
)

export const listNotificationsValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(50).optional(),
    unread: vine.boolean().optional(),
  })
)

export const updateNotificationValidator = vine.compile(
  vine.object({ params: vine.object({ id }), read: vine.boolean() })
)
