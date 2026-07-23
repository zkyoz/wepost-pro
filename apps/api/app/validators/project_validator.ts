import { PROJECT_STATUSES } from '#domain/projects/project_status'
import vine from '@vinejs/vine'

const projectIdParams = vine.object({ id: vine.string().uuid() })
const memberIds = vine.array(vine.string().uuid()).distinct()

export const projectIdValidator = vine.compile(vine.object({ params: projectIdParams }))

export const listProjectsValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(50).optional(),
    q: vine.string().trim().maxLength(120).optional(),
    status: vine.enum(PROJECT_STATUSES).optional(),
  })
)

export const createProjectValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120),
    description: vine.string().trim().maxLength(5000).optional(),
    clientUserId: vine.string().uuid(),
    memberUserIds: memberIds.optional(),
    timezone: vine.string().trim().minLength(1).maxLength(80),
  })
)

export const updateProjectValidator = vine.compile(
  vine.object({
    params: projectIdParams,
    name: vine.string().trim().minLength(2).maxLength(120).optional(),
    description: vine.string().trim().maxLength(5000).optional(),
    clientUserId: vine.string().uuid().optional(),
    memberUserIds: memberIds.optional(),
    timezone: vine.string().trim().minLength(1).maxLength(80).optional(),
  })
)
