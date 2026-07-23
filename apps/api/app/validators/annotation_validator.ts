import { ANNOTATION_SHAPES } from '#domain/annotations/annotation_geometry'
import vine from '@vinejs/vine'

const id = vine.string().uuid()
const coordinate = vine.number().min(0).max(1)
const geometry = {
  shape: vine.enum(ANNOTATION_SHAPES),
  x: coordinate,
  y: coordinate,
  width: coordinate.optional().nullable(),
  height: coordinate.optional().nullable(),
}

export const listAnnotationsValidator = vine.compile(
  vine.object({
    params: vine.object({ publicationId: id, mediaId: id }),
    version: vine.number().min(1).optional(),
  })
)
export const createAnnotationValidator = vine.compile(
  vine.object({
    params: vine.object({ publicationId: id, mediaId: id }),
    ...geometry,
    body: vine.string().trim().minLength(1).maxLength(2000),
    commentId: id.optional().nullable(),
  })
)
export const updateAnnotationValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    ...geometry,
    body: vine.string().trim().minLength(1).maxLength(2000),
  })
)
export const annotationIdValidator = vine.compile(vine.object({ params: vine.object({ id }) }))
