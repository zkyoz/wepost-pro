import { SOCIAL_NETWORKS } from '#domain/publications/publication_lifecycle'
import { SUPERVISION_CATEGORIES } from '#domain/supervision/supervision'
import vine from '@vinejs/vine'

const id = vine.string().uuid()
const filters = {
  clientId: id.optional(),
  projectId: id.optional(),
  network: vine.enum(SOCIAL_NETWORKS).optional(),
  from: vine.string().trim().minLength(10).maxLength(40).optional(),
  to: vine.string().trim().minLength(10).maxLength(40).optional(),
  responsibleId: id.optional(),
}

export const supervisionSummaryValidator = vine.compile(vine.object(filters))

export const supervisionItemsValidator = vine.compile(
  vine.object({
    ...filters,
    category: vine.enum(SUPERVISION_CATEGORIES),
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(50).optional(),
  })
)

export const supervisionNotificationValidator = vine.compile(
  vine.object({ params: vine.object({ id }) })
)
