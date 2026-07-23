import {
  InvalidAnnotationGeometryError,
  isAnnotationHistorical,
  validateAnnotationGeometry,
} from '#domain/annotations/annotation_geometry'
import { test } from '@japa/runner'

test.group('Annotation geometry and version', () => {
  test('accepts normalized points and rectangles', ({ assert }) => {
    assert.deepEqual(validateAnnotationGeometry({ shape: 'point', x: 0.5, y: 0.25 }), {
      shape: 'point',
      x: 0.5,
      y: 0.25,
      width: null,
      height: null,
    })
    assert.deepEqual(
      validateAnnotationGeometry({
        shape: 'rectangle',
        x: 0.1,
        y: 0.2,
        width: 0.4,
        height: 0.3,
      }),
      { shape: 'rectangle', x: 0.1, y: 0.2, width: 0.4, height: 0.3 }
    )
  })

  test('rejects coordinates outside the media or incompatible with the shape', ({ assert }) => {
    assert.throws(
      () => validateAnnotationGeometry({ shape: 'point', x: -0.01, y: 0.5 }),
      InvalidAnnotationGeometryError
    )
    assert.throws(
      () => validateAnnotationGeometry({ shape: 'point', x: 0.5, y: 0.5, width: 0.2 }),
      InvalidAnnotationGeometryError
    )
    assert.throws(
      () =>
        validateAnnotationGeometry({
          shape: 'rectangle',
          x: 0.8,
          y: 0.8,
          width: 0.3,
          height: 0.3,
        }),
      InvalidAnnotationGeometryError
    )
  })

  test('marks a previous publication or detached media version as historical', ({ assert }) => {
    assert.isFalse(
      isAnnotationHistorical({
        annotationVersion: 3,
        currentVersion: 3,
        mediaCurrentlyAttached: true,
      })
    )
    assert.isTrue(
      isAnnotationHistorical({
        annotationVersion: 2,
        currentVersion: 3,
        mediaCurrentlyAttached: true,
      })
    )
    assert.isTrue(
      isAnnotationHistorical({
        annotationVersion: 3,
        currentVersion: 3,
        mediaCurrentlyAttached: false,
      })
    )
  })
})
