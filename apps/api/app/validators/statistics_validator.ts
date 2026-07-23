import { SOCIAL_NETWORKS } from '#domain/publications/publication_lifecycle'
import vine from '@vinejs/vine'

export const statisticsValidator = vine.compile(
  vine.object({
    from: vine.string().trim().fixedLength(10),
    to: vine.string().trim().fixedLength(10),
    projectId: vine.string().uuid().optional(),
    network: vine.enum(SOCIAL_NETWORKS).optional(),
  })
)
