import { AI_LANGUAGES, AI_LENGTHS, AI_TONES } from '#domain/ai/text_generation'
import { SOCIAL_NETWORKS } from '#domain/publications/publication_lifecycle'
import vine from '@vinejs/vine'

const id = vine.string().uuid()
const text = vine.string().trim().minLength(1).maxLength(20_000)

export const publicationNetworkVariantParamsValidator = vine.compile(
  vine.object({ params: vine.object({ id }) })
)

export const effectiveNetworkVariantValidator = vine.compile(
  vine.object({ params: vine.object({ id, network: vine.enum(SOCIAL_NETWORKS) }) })
)

export const createNetworkVariantValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    network: vine.enum(SOCIAL_NETWORKS),
    text,
  })
)

export const generateNetworkVariantsValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    networks: vine.array(vine.enum(SOCIAL_NETWORKS)).minLength(1).maxLength(5).distinct(),
    tone: vine.enum(AI_TONES),
    length: vine.enum(AI_LENGTHS),
    language: vine.enum(AI_LANGUAGES),
  })
)

export const updateNetworkVariantValidator = vine.compile(
  vine.object({ params: vine.object({ id }), text })
)
