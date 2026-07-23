import { TIKTOK_PRIVACY_LEVELS } from '#domain/social/tiktok'
import vine from '@vinejs/vine'

const uuid = vine.string().uuid()
const videoFields = {
  accountId: uuid,
  privacyLevel: vine.enum(TIKTOK_PRIVACY_LEVELS),
  caption: vine.string().trim().maxLength(2200),
  disableComment: vine.boolean(),
  disableDuet: vine.boolean(),
  disableStitch: vine.boolean(),
  brandContentToggle: vine.boolean(),
  brandOrganicToggle: vine.boolean(),
  isAigc: vine.boolean(),
}

export const tiktokOAuthStartValidator = vine.compile(vine.object({ agencyId: uuid.optional() }))
export const tiktokOAuthCallbackValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1).maxLength(2048),
    state: vine.string().trim().minLength(20).maxLength(4096),
  })
)
export const tiktokAccountValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }) })
)
export const tiktokPublicationValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }), ...videoFields })
)
export const tiktokScheduleValidator = vine.compile(
  vine.object({
    params: vine.object({ id: uuid }),
    ...videoFields,
    runAt: vine.string().trim().maxLength(80).nullable().optional(),
  })
)
export const tiktokStatusValidator = vine.compile(
  vine.object({ params: vine.object({ id: uuid }) })
)
