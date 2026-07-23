import { USER_ROLES } from '#domain/auth/user_role'
import vine from '@vinejs/vine'

const params = vine.object({ id: vine.string().uuid() })

export const listAdminUsersValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals().positive().optional(),
    perPage: vine.number().withoutDecimals().min(1).max(100).optional(),
    q: vine.string().trim().maxLength(120).optional(),
    role: vine.enum(USER_ROLES).optional(),
    status: vine.enum(['active', 'inactive'] as const).optional(),
  })
)

export const userIdValidator = vine.compile(vine.object({ params }))

export const updateUserRoleValidator = vine.compile(
  vine.object({ params, role: vine.enum(USER_ROLES) })
)

export const updateUserStatusValidator = vine.compile(
  vine.object({ params, isActive: vine.boolean() })
)
