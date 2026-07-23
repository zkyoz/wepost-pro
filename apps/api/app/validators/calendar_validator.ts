import { PUBLICATION_STATUSES, SOCIAL_NETWORKS } from '#domain/publications/publication_lifecycle'
import vine from '@vinejs/vine'

const id = vine.string().uuid()

export const listCalendarValidator = vine.compile(
  vine.object({
    start: vine.string().trim().minLength(10).maxLength(40),
    end: vine.string().trim().minLength(10).maxLength(40),
    timezone: vine.string().trim().minLength(1).maxLength(80),
    projectId: id.optional(),
    clientId: id.optional(),
    network: vine.enum(SOCIAL_NETWORKS).optional(),
    status: vine.enum(PUBLICATION_STATUSES).optional(),
    includeUndated: vine.boolean().optional(),
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(100).optional(),
  })
)

export const moveCalendarPublicationValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    contentVersion: vine.number().min(1),
    scheduledAt: vine.string().trim().maxLength(40).nullable(),
    timezone: vine.string().trim().minLength(1).maxLength(80),
  })
)
