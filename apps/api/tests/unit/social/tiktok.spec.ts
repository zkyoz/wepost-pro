import {
  normalizeTikTokError,
  tiktokIdempotencyKey,
  tiktokPayloadHash,
  validateTikTokPublication,
} from '#domain/social/tiktok'
import { decryptSocialToken, encryptSocialToken } from '#services/social/token_cipher'
import { test } from '@japa/runner'

const key = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY='
const video = {
  privacyLevel: 'SELF_ONLY' as const,
  caption: 'Bonjour TikTok',
  disableComment: false,
  disableDuet: false,
  disableStitch: false,
  brandContentToggle: false,
  brandOrganicToggle: true,
  isAigc: false,
}
function validInput() {
  return {
    status: 'approved',
    contentVersion: 3,
    approvedVersion: 3,
    targetNetworks: ['tiktok'],
    accountStatus: 'connected',
    accountExpiresAt: Date.now() + 60_000,
    creator: {
      privacyLevelOptions: ['SELF_ONLY'],
      commentDisabled: false,
      duetDisabled: false,
      stitchDisabled: false,
      maxVideoPostDurationSec: 180,
    },
    video,
    media: [
      {
        mimeType: 'video/mp4',
        scanStatus: 'clean',
        deleted: false,
        sizeBytes: 20,
        width: 1080,
        height: 1920,
        durationMs: 30_000,
      },
    ],
  }
}

test.group('TikTok publishing domain', () => {
  test('validates an approved MP4 against creator capabilities', ({ assert }) => {
    assert.isTrue(validateTikTokPublication(validInput()).valid)
    const invalid = validateTikTokPublication({
      ...validInput(),
      status: 'in_progress',
      approvedVersion: 2,
      accountStatus: 'expired',
      creator: { ...validInput().creator, privacyLevelOptions: [], commentDisabled: true },
      media: [
        {
          ...validInput().media[0],
          mimeType: 'image/jpeg',
          scanStatus: 'quarantined',
          sizeBytes: 4_000_000_001,
        },
      ],
    })
    assert.isFalse(invalid.valid)
    assert.isAtLeast(invalid.errors.length, 7)
  })

  test('warns when technical metadata will be verified remotely', ({ assert }) => {
    const result = validateTikTokPublication({
      ...validInput(),
      media: [{ ...validInput().media[0], width: null, height: null, durationMs: null }],
    })
    assert.isTrue(result.valid)
    assert.isNotEmpty(result.warnings)
  })

  test('creates stable keys and detects payload changes', ({ assert }) => {
    const keyInput = { publicationId: 'publication', version: 4, accountId: 'account' }
    assert.equal(tiktokIdempotencyKey(keyInput), tiktokIdempotencyKey(keyInput))
    assert.notEqual(
      tiktokIdempotencyKey(keyInput),
      tiktokIdempotencyKey({ ...keyInput, version: 5 })
    )
    const input = {
      video,
      media: [
        {
          storageKey: 'video.mp4',
          mimeType: 'video/mp4',
          checksum: 'abc',
          position: 0,
          sizeBytes: 20,
        },
      ],
    }
    assert.notEqual(
      tiktokPayloadHash(input),
      tiktokPayloadHash({ ...input, video: { ...video, caption: 'Modifié' } })
    )
    assert.notEqual(
      tiktokPayloadHash(input),
      tiktokPayloadHash({ ...input, media: [{ ...input.media[0], position: 1 }] })
    )
  })

  test('normalizes retryable and permanent errors', ({ assert }) => {
    assert.deepInclude(normalizeTikTokError({ name: 'AbortError' }), {
      category: 'timeout',
      retryable: true,
    })
    assert.deepInclude(normalizeTikTokError({ code: 'processing_pending' }), {
      category: 'server',
      retryable: true,
    })
    assert.deepInclude(normalizeTikTokError({ httpStatus: 429 }), {
      category: 'rate_limit',
      retryable: true,
    })
    assert.deepInclude(normalizeTikTokError({ httpStatus: 503 }), {
      category: 'server',
      retryable: true,
    })
    assert.deepInclude(normalizeTikTokError({ httpStatus: 401 }), {
      category: 'token_expired',
      retryable: false,
    })
    assert.deepInclude(normalizeTikTokError({ httpStatus: 403 }), {
      category: 'permission',
      retryable: false,
    })
    assert.deepInclude(normalizeTikTokError({ httpStatus: 422 }), {
      category: 'invalid_content',
      retryable: false,
    })
    assert.deepInclude(normalizeTikTokError({}), { category: 'unknown', retryable: false })
  })

  test('encrypts OAuth tokens with authenticated encryption', ({ assert }) => {
    const encrypted = encryptSocialToken('secret-token', key)
    assert.notInclude(encrypted, 'secret-token')
    assert.equal(decryptSocialToken(encrypted, key), 'secret-token')
    assert.throws(() => decryptSocialToken(`${encrypted}broken`, key))
  })
})
