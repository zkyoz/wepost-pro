import vine from '@vinejs/vine'

const uuid = vine.string().uuid()

export const facebookOAuthStartValidator = vine.compile(
  vine.object({
    pageId: vine
      .string()
      .trim()
      .regex(/^\d{5,30}$/),
    agencyId: uuid.optional(),
  })
)

export const facebookOAuthCallbackValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1).maxLength(2048),
    state: vine.string().trim().minLength(20).maxLength(4096),
  })
)

export const facebookAccountValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }) })
)

export const facebookPublicationValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }), accountId: uuid })
)

export const facebookScheduleValidator = vine.compile(
  vine.object({
    params: vine.object({ id: uuid }),
    accountId: uuid,
    runAt: vine.string().trim().maxLength(80).nullable().optional(),
  })
)

export const facebookStatusValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }) })
)
