import vine from '@vinejs/vine'

const uuid = vine.string().uuid()

export const linkedinOAuthStartValidator = vine.compile(
  vine.object({
    organizationId: vine
      .string()
      .trim()
      .regex(/^\d{5,30}$/),
    agencyId: uuid.optional(),
  })
)

export const linkedinOAuthCallbackValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1).maxLength(2048),
    state: vine.string().trim().minLength(20).maxLength(4096),
  })
)

export const linkedinAccountValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }) })
)

export const linkedinPublicationValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }), accountId: uuid })
)

export const linkedinScheduleValidator = vine.compile(
  vine.object({
    params: vine.object({ id: uuid }),
    accountId: uuid,
    runAt: vine.string().trim().maxLength(80).nullable().optional(),
  })
)

export const linkedinStatusValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }) })
)
