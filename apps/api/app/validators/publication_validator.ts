import { PUBLICATION_STATUSES, SOCIAL_NETWORKS } from '#domain/publications/publication_lifecycle'
import vine from '@vinejs/vine'

const id = vine.string().uuid()
const publicationFields = {
  title: vine.string().trim().minLength(2).maxLength(120),
  baseText: vine.string().trim().maxLength(10000),
  targetNetworks: vine.array(vine.enum(SOCIAL_NETWORKS)).minLength(1).distinct(),
  scheduledAt: vine.string().trim().maxLength(40).nullable().optional(),
  timezone: vine.string().trim().minLength(1).maxLength(80),
}

export const listPublicationsValidator = vine.compile(
  vine.object({
    params: vine.object({ projectId: id }),
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(50).optional(),
    q: vine.string().trim().maxLength(120).optional(),
    status: vine.enum(PUBLICATION_STATUSES).optional(),
    network: vine.enum(SOCIAL_NETWORKS).optional(),
  })
)

export const createPublicationValidator = vine.compile(
  vine.object({
    params: vine.object({ projectId: id }),
    ...publicationFields,
  })
)

export const showPublicationValidator = vine.compile(vine.object({ params: vine.object({ id }) }))

export const updatePublicationValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    contentVersion: vine.number().min(1),
    title: publicationFields.title.optional(),
    baseText: publicationFields.baseText.optional(),
    targetNetworks: publicationFields.targetNetworks.optional(),
    scheduledAt: publicationFields.scheduledAt,
    timezone: publicationFields.timezone.optional(),
  })
)

export const transitionPublicationValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    contentVersion: vine.number().min(1),
    status: vine.enum(PUBLICATION_STATUSES),
  })
)
