import { AnnotationSchema } from '#database/schema'

export type AnnotationShape = 'point' | 'rectangle'

export default class Annotation extends AnnotationSchema {
  declare shape: AnnotationShape
}
