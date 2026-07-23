export const ANNOTATION_SHAPES = ['point', 'rectangle'] as const
export type AnnotationShape = (typeof ANNOTATION_SHAPES)[number]

export type AnnotationGeometry = {
  shape: AnnotationShape
  x: number
  y: number
  width?: number | null
  height?: number | null
}

export class InvalidAnnotationGeometryError extends Error {}

function normalized(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 1
}

export function validateAnnotationGeometry(input: AnnotationGeometry) {
  if (!normalized(input.x) || !normalized(input.y)) {
    throw new InvalidAnnotationGeometryError('Les coordonnées doivent être comprises entre 0 et 1.')
  }
  if (input.shape === 'point') {
    if (
      (input.width !== null && input.width !== undefined) ||
      (input.height !== null && input.height !== undefined)
    ) {
      throw new InvalidAnnotationGeometryError('Un point ne possède ni largeur ni hauteur.')
    }
    return { shape: input.shape, x: input.x, y: input.y, width: null, height: null }
  }
  const width = input.width
  const height = input.height
  if (
    width === null ||
    width === undefined ||
    height === null ||
    height === undefined ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    input.x + width > 1 ||
    input.y + height > 1
  ) {
    throw new InvalidAnnotationGeometryError(
      'Le rectangle doit rester entièrement dans les limites du média.'
    )
  }
  return { shape: input.shape, x: input.x, y: input.y, width, height }
}

export function isAnnotationHistorical(input: {
  annotationVersion: number
  currentVersion: number
  mediaCurrentlyAttached: boolean
}) {
  return input.annotationVersion !== input.currentVersion || !input.mediaCurrentlyAttached
}
