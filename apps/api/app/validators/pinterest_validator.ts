import vine from '@vinejs/vine'

const uuid = vine.string().uuid()
const pinFields = {
  accountId: uuid,
  boardId: vine
    .string()
    .trim()
    .regex(/^\d{5,30}$/),
  title: vine.string().trim().minLength(1).maxLength(100),
  description: vine.string().trim().minLength(1).maxLength(800),
  link: vine.string().trim().maxLength(2048).nullable().optional(),
}

export const pinterestOAuthStartValidator = vine.compile(vine.object({ agencyId: uuid.optional() }))
export const pinterestOAuthCallbackValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1).maxLength(2048),
    state: vine.string().trim().minLength(20).maxLength(4096),
  })
)
export const pinterestAccountValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }) })
)
export const pinterestPublicationValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }), ...pinFields })
)
export const pinterestScheduleValidator = vine.compile(
  vine.object({
    params: vine.object({ id: uuid }),
    ...pinFields,
    runAt: vine.string().trim().maxLength(80).nullable().optional(),
  })
)
export const pinterestStatusValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }) })
)
