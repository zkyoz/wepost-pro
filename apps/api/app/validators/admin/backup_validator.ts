import vine from '@vinejs/vine'

export const adminBackupsValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals().positive().optional(),
    perPage: vine.number().withoutDecimals().min(1).max(100).optional(),
    status: vine.enum(['running', 'succeeded', 'failed'] as const).optional(),
    type: vine.enum(['database', 'restore_drill'] as const).optional(),
  })
)
