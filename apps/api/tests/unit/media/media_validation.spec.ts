import {
  createStorageKey,
  InvalidMediaError,
  validateAlternative,
  validateMediaBuffer,
} from '#domain/media/media_validation'
import { test } from '@japa/runner'
import { createHash } from 'node:crypto'

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64'
)

test.group('Media validation', () => {
  test('creates an opaque scoped key without using the original filename', ({ assert }) => {
    const key = createStorageKey({
      environment: 'staging/eu',
      agencyId: '10000000-0000-4000-8000-000000000001',
      mediaId: '20000000-0000-4000-8000-000000000001',
      mimeType: 'image/png',
    })
    assert.match(
      key,
      /^staging-eu\/agencies\/10000000-0000-4000-8000-000000000001\/media\/20000000-0000-4000-8000-000000000001\/[a-f0-9-]+\.png$/
    )
    assert.notInclude(key, 'photo-client')
  })

  test('detects magic bytes, dimensions and checksum', async ({ assert }) => {
    const result = await validateMediaBuffer({
      bytes: png,
      declaredMimeType: 'image/png',
      expectedSize: png.length,
      expectedChecksum: createHash('sha256').update(png).digest('hex'),
      allowedMimeTypes: ['image/png'],
      maxBytes: 1024,
    })
    assert.deepInclude(result, { mimeType: 'image/png', width: 1, height: 1 })
  })

  test('rejects MIME spoofing, corruption and oversized files', async ({ assert }) => {
    const checksum = createHash('sha256').update(png).digest('hex')
    await assert.rejects(
      () =>
        validateMediaBuffer({
          bytes: png,
          declaredMimeType: 'image/jpeg',
          expectedSize: png.length,
          expectedChecksum: checksum,
          allowedMimeTypes: ['image/png', 'image/jpeg'],
          maxBytes: 1024,
        }),
      InvalidMediaError
    )
    await assert.rejects(
      () =>
        validateMediaBuffer({
          bytes: png,
          declaredMimeType: 'image/png',
          expectedSize: png.length,
          expectedChecksum: '0'.repeat(64),
          allowedMimeTypes: ['image/png'],
          maxBytes: 1024,
        }),
      InvalidMediaError
    )
    await assert.rejects(
      () =>
        validateMediaBuffer({
          bytes: png,
          declaredMimeType: 'image/png',
          expectedSize: png.length,
          expectedChecksum: checksum,
          allowedMimeTypes: ['image/png'],
          maxBytes: 10,
        }),
      InvalidMediaError
    )
  })

  test('requires an alternative or an explicit decorative choice', ({ assert }) => {
    assert.throws(
      () => validateAlternative({ mimeType: 'image/png', altText: '', isDecorative: false }),
      InvalidMediaError
    )
    assert.doesNotThrow(() =>
      validateAlternative({ mimeType: 'image/png', altText: null, isDecorative: true })
    )
  })
})
