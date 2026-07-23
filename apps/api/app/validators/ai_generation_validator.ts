import { AI_LANGUAGES, AI_LENGTHS, AI_TONES } from '#domain/ai/text_generation'
import vine from '@vinejs/vine'

const id = vine.string().uuid()

export const createAiGenerationValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    brief: vine.string().trim().minLength(10).maxLength(2000),
    tone: vine.enum(AI_TONES),
    length: vine.enum(AI_LENGTHS),
    language: vine.enum(AI_LANGUAGES),
    variantCount: vine.number().min(2).max(5),
  })
)

export const aiGenerationParamsValidator = vine.compile(
  vine.object({ params: vine.object({ id }) })
)

export const applyAiVariantValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    variantId: vine.string().regex(/^variant-[1-5]$/),
    contentVersion: vine.number().min(1),
  })
)
