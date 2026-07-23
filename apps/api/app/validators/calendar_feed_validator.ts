import vine from '@vinejs/vine'

const id = vine.string().uuid()

export const calendarExportValidator = vine.compile(
  vine.object({
    start: vine.string().trim().minLength(10).maxLength(40),
    end: vine.string().trim().minLength(10).maxLength(40),
    timezone: vine.string().trim().minLength(1).maxLength(80),
    projectId: id.optional(),
  })
)

export const createCalendarFeedValidator = vine.compile(
  vine.object({ projectId: id.optional().nullable() })
)

export const calendarFeedIdValidator = vine.compile(vine.object({ params: vine.object({ id }) }))
