import {
  instagramIdempotencyKey,
  instagramPayloadHash,
  normalizeInstagramError,
  validateInstagramPublication,
} from '#domain/social/instagram'
import { decryptSocialToken, encryptSocialToken } from '#services/social/token_cipher'
import { test } from '@japa/runner'

const key = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY='

function validInput() {
  return {
    status: 'approved',
    contentVersion: 3,
    approvedVersion: 3,
    targetNetworks: ['instagram'],
    baseText: 'Publication Instagram',
    accountStatus: 'connected',
    accountExpiresAt: Date.now() + 60_000,
    media: [{ mimeType: 'image/jpeg', scanStatus: 'clean', deleted: false }],
  }
}

test.group('Instagram publishing domain', () => {
  test('validates approval, account, target and compatible media', ({ assert }) => {
    assert.isTrue(validateInstagramPublication(validInput()).valid)
    const invalid = validateInstagramPublication({
      ...validInput(),
      status: 'in_progress',
      approvedVersion: 2,
      targetNetworks: ['linkedin'],
      accountStatus: 'expired',
      media: [{ mimeType: 'image/webp', scanStatus: 'quarantined', deleted: false }],
    })
    assert.isFalse(invalid.valid)
    assert.isAtLeast(invalid.errors.length, 5)
  })

  test('creates a stable scoped idempotency key', ({ assert }) => {
    const input = { publicationId: 'publication', version: 4, accountId: 'page-account' }
    assert.equal(instagramIdempotencyKey(input), instagramIdempotencyKey(input))
    assert.notEqual(
      instagramIdempotencyKey(input),
      instagramIdempotencyKey({ ...input, version: 5 })
    )
  })

  test('detects any change to scheduled text or media order', ({ assert }) => {
    const input = {
      text: 'Texte approuvé',
      media: [{ storageKey: 'a.jpg', mimeType: 'image/jpeg', checksum: 'abc', position: 0 }],
    }
    assert.notEqual(
      instagramPayloadHash(input),
      instagramPayloadHash({ ...input, text: 'Texte modifié' })
    )
    assert.notEqual(
      instagramPayloadHash(input),
      instagramPayloadHash({
        ...input,
        media: [{ ...input.media[0], position: 1 }],
      })
    )
  })

  test('normalizes transient and permanent Instagram failures', ({ assert }) => {
    assert.deepInclude(normalizeInstagramError({ httpStatus: 429, code: 4 }), {
      category: 'rate_limit',
      retryable: true,
    })
    assert.deepInclude(normalizeInstagramError({ httpStatus: 503, code: 2 }), {
      category: 'server',
      retryable: true,
    })
    assert.deepInclude(normalizeInstagramError({ httpStatus: 400, code: 190 }), {
      category: 'token_expired',
      retryable: false,
    })
  })

  test('encrypts OAuth tokens with authenticated encryption', ({ assert }) => {
    const encrypted = encryptSocialToken('secret-page-token', key)
    assert.notInclude(encrypted, 'secret-page-token')
    assert.equal(decryptSocialToken(encrypted, key), 'secret-page-token')
    assert.throws(() => decryptSocialToken(`${encrypted}broken`, key))
  })
})
