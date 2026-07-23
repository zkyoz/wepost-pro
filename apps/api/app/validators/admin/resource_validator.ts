import { PUBLICATION_STATUSES } from '#domain/publications/publication_lifecycle'
import vine from '@vinejs/vine'

const NETWORKS = ['facebook', 'instagram', 'linkedin', 'pinterest', 'tiktok'] as const
const ACCOUNT_STATUSES = ['connected', 'expired', 'revoked', 'error'] as const
const ATTEMPT_RESULTS = [
  'started',
  'success',
  'transient_failure',
  'permanent_failure',
  'skipped',
] as const

const pagination = {
  page: vine.number().withoutDecimals().positive().optional(),
  perPage: vine.number().withoutDecimals().min(1).max(100).optional(),
  q: vine.string().trim().maxLength(120).optional(),
}

export const adminIdValidator = vine.compile(
  vine.object({ params: vine.object({ id: vine.string().uuid() }) })
)

export const adminProjectsValidator = vine.compile(
  vine.object({
    ...pagination,
    status: vine.enum(['active', 'archived'] as const).optional(),
  })
)

export const adminPublicationsValidator = vine.compile(
  vine.object({
    ...pagination,
    status: vine.enum(PUBLICATION_STATUSES).optional(),
  })
)

export const adminSocialAccountsValidator = vine.compile(
  vine.object({
    ...pagination,
    network: vine.enum(NETWORKS).optional(),
    status: vine.enum(ACCOUNT_STATUSES).optional(),
  })
)

export const adminIncidentsValidator = vine.compile(
  vine.object({
    ...pagination,
    result: vine.enum(ATTEMPT_RESULTS).optional(),
  })
)

export const adminAuditValidator = vine.compile(
  vine.object({
    ...pagination,
    action: vine.string().trim().maxLength(80).optional(),
    entityType: vine.string().trim().maxLength(50).optional(),
  })
)
