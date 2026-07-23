import vine from '@vinejs/vine'

const uuid = vine.string().uuid()

export const instagramOAuthStartValidator = vine.compile(
  vine.object({
    instagramAccountId: vine
      .string()
      .trim()
      .regex(/^\d{5,30}$/),
    agencyId: uuid.optional(),
  })
)

export const instagramOAuthCallbackValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1).maxLength(2048),
    state: vine.string().trim().minLength(20).maxLength(4096),
  })
)

export const instagramAccountValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }) })
)

export const instagramPublicationValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }), accountId: uuid })
)

export const instagramScheduleValidator = vine.compile(
  vine.object({
    params: vine.object({ id: uuid }),
    accountId: uuid,
    runAt: vine.string().trim().maxLength(80).nullable().optional(),
  })
)

export const instagramStatusValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }) })
)
