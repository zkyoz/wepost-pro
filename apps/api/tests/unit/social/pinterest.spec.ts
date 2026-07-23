import {
  pinterestIdempotencyKey,
  pinterestPayloadHash,
  normalizePinterestError,
  validatePinterestPublication,
} from '#domain/social/pinterest'
import { decryptSocialToken, encryptSocialToken } from '#services/social/token_cipher'
import { test } from '@japa/runner'

const key = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY='

function validInput() {
  return {
    status: 'approved',
    contentVersion: 3,
    approvedVersion: 3,
    targetNetworks: ['pinterest'],
    accountStatus: 'connected',
    accountExpiresAt: Date.now() + 60_000,
    boardExists: true,
    pin: {
      boardId: '123456789',
      title: 'Publication Pinterest',
      description: 'Description du Pin',
      link: 'https://wepost.pro/campagne',
    },
    media: [{ mimeType: 'image/jpeg', scanStatus: 'clean', deleted: false }],
  }
}

test.group('Pinterest publishing domain', () => {
  test('validates approval, account, target and compatible media', ({ assert }) => {
    assert.isTrue(validatePinterestPublication(validInput()).valid)
    const invalid = validatePinterestPublication({
      ...validInput(),
      status: 'in_progress',
      approvedVersion: 2,
      targetNetworks: ['pinterest'],
      accountStatus: 'expired',
      boardExists: false,
      pin: { boardId: '', title: '', description: '', link: 'javascript:alert(1)' },
      media: [{ mimeType: 'image/webp', scanStatus: 'quarantined', deleted: false }],
    })
    assert.isFalse(invalid.valid)
    assert.isAtLeast(invalid.errors.length, 5)
  })

  test('creates a stable scoped idempotency key', ({ assert }) => {
    const input = { publicationId: 'publication', version: 4, accountId: 'page-account' }
    assert.equal(pinterestIdempotencyKey(input), pinterestIdempotencyKey(input))
    assert.notEqual(
      pinterestIdempotencyKey(input),
      pinterestIdempotencyKey({ ...input, version: 5 })
    )
  })

  test('detects any change to scheduled pin or media order', ({ assert }) => {
    const input = {
      pin: validInput().pin,
      media: [{ storageKey: 'a.jpg', mimeType: 'image/jpeg', checksum: 'abc', position: 0 }],
    }
    assert.notEqual(
      pinterestPayloadHash(input),
      pinterestPayloadHash({ ...input, pin: { ...input.pin, title: 'Titre modifié' } })
    )
    assert.notEqual(
      pinterestPayloadHash(input),
      pinterestPayloadHash({
        ...input,
        media: [{ ...input.media[0], position: 1 }],
      })
    )
  })

  test('normalizes transient and permanent Pinterest failures', ({ assert }) => {
    assert.deepInclude(normalizePinterestError({ name: 'AbortError' }), {
      category: 'timeout',
      retryable: true,
    })
    assert.deepInclude(normalizePinterestError({ code: '429' }), {
      category: 'rate_limit',
      retryable: true,
    })
    assert.deepInclude(normalizePinterestError({ httpStatus: 429, code: 4 }), {
      category: 'rate_limit',
      retryable: true,
    })
    assert.deepInclude(normalizePinterestError({ httpStatus: 503, code: 2 }), {
      category: 'server',
      retryable: true,
    })
    assert.deepInclude(normalizePinterestError({ httpStatus: 401, code: 401 }), {
      category: 'token_expired',
      retryable: false,
    })
    assert.deepInclude(normalizePinterestError({ code: '2' }), {
      category: 'token_expired',
      retryable: false,
    })
    assert.deepInclude(normalizePinterestError({ httpStatus: 403 }), {
      category: 'permission',
      retryable: false,
    })
    assert.deepInclude(normalizePinterestError({ httpStatus: 422 }), {
      category: 'invalid_content',
      retryable: false,
    })
    assert.deepInclude(normalizePinterestError({}), {
      category: 'unknown',
      code: 'unknown',
      retryable: false,
    })
  })

  test('rejects an expired account, missing target and missing image', ({ assert }) => {
    const invalid = validatePinterestPublication({
      ...validInput(),
      targetNetworks: [],
      accountExpiresAt: Date.now() - 1,
      media: [],
    })
    assert.isFalse(invalid.valid)
    assert.include(invalid.errors, 'Pinterest ne fait pas partie des réseaux ciblés.')
    assert.include(invalid.errors, 'Le jeton Pinterest est expiré.')
    assert.include(invalid.errors, 'Un Pin doit contenir exactement une image.')
  })

  test('encrypts OAuth tokens with authenticated encryption', ({ assert }) => {
    const encrypted = encryptSocialToken('secret-page-token', key)
    assert.notInclude(encrypted, 'secret-page-token')
    assert.equal(decryptSocialToken(encrypted, key), 'secret-page-token')
    assert.throws(() => decryptSocialToken(`${encrypted}broken`, key))
  })
})
