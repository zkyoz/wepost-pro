import vine from '@vinejs/vine'

const id = vine.string().uuid()

export const initializeMediaUploadValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    originalName: vine.string().trim().minLength(1).maxLength(255),
    declaredMimeType: vine.string().trim().minLength(3).maxLength(120),
    sizeBytes: vine.number().min(1),
    checksum: vine
      .string()
      .trim()
      .regex(/^[a-fA-F0-9]{64}$/),
    altText: vine.string().trim().maxLength(2000).nullable().optional(),
    isDecorative: vine.boolean().optional(),
  })
)

export const mediaIdValidator = vine.compile(vine.object({ params: vine.object({ id }) }))

export const attachMediaValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    mediaId: id,
  })
)

export const publicationMediaValidator = vine.compile(
  vine.object({ params: vine.object({ id, mediaId: id }) })
)

export const updateMediaValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    altText: vine.string().trim().maxLength(2000).nullable().optional(),
    isDecorative: vine.boolean(),
  })
)

export const reorderMediaValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    mediaIds: vine.array(id).distinct(),
  })
)
