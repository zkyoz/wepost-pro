import {
  linkedinIdempotencyKey,
  linkedinPayloadHash,
  normalizeLinkedInError,
  validateLinkedInPublication,
} from '#domain/social/linkedin'
import { decryptSocialToken, encryptSocialToken } from '#services/social/token_cipher'
import { test } from '@japa/runner'

const key = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY='

function validInput() {
  return {
    status: 'approved',
    contentVersion: 3,
    approvedVersion: 3,
    targetNetworks: ['linkedin'],
    baseText: 'Publication LinkedIn',
    accountStatus: 'connected',
    accountExpiresAt: Date.now() + 60_000,
    media: [{ mimeType: 'image/jpeg', scanStatus: 'clean', deleted: false }],
  }
}

test.group('LinkedIn publishing domain', () => {
  test('validates approval, account, target and compatible media', ({ assert }) => {
    assert.isTrue(validateLinkedInPublication(validInput()).valid)
    const invalid = validateLinkedInPublication({
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
    assert.equal(linkedinIdempotencyKey(input), linkedinIdempotencyKey(input))
    assert.notEqual(linkedinIdempotencyKey(input), linkedinIdempotencyKey({ ...input, version: 5 }))
  })

  test('detects any change to scheduled text or media order', ({ assert }) => {
    const input = {
      text: 'Texte approuvé',
      media: [{ storageKey: 'a.jpg', mimeType: 'image/jpeg', checksum: 'abc', position: 0 }],
    }
    assert.notEqual(
      linkedinPayloadHash(input),
      linkedinPayloadHash({ ...input, text: 'Texte modifié' })
    )
    assert.notEqual(
      linkedinPayloadHash(input),
      linkedinPayloadHash({
        ...input,
        media: [{ ...input.media[0], position: 1 }],
      })
    )
  })

  test('normalizes transient and permanent LinkedIn failures', ({ assert }) => {
    assert.deepInclude(normalizeLinkedInError({ httpStatus: 429, code: 4 }), {
      category: 'rate_limit',
      retryable: true,
    })
    assert.deepInclude(normalizeLinkedInError({ httpStatus: 503, code: 2 }), {
      category: 'server',
      retryable: true,
    })
    assert.deepInclude(normalizeLinkedInError({ httpStatus: 401, code: 401 }), {
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
