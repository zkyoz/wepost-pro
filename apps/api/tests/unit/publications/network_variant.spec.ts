import {
  isNetworkVariantStale,
  NetworkVariantLengthError,
  selectEffectiveNetworkText,
  validateNetworkVariantText,
} from '#domain/publications/network_variant'
import { test } from '@japa/runner'

test.group('Publication network variant domain', () => {
  test('selects only an approved variant from the current source version', ({ assert }) => {
    assert.deepEqual(
      selectEffectiveNetworkText('Source', 3, {
        id: 'variant-id',
        text: 'LinkedIn approuvé',
        sourceVersion: 3,
        status: 'approved',
      }),
      { text: 'LinkedIn approuvé', source: 'variant', variantId: 'variant-id' }
    )
    assert.deepEqual(
      selectEffectiveNetworkText('Source', 3, {
        id: 'variant-id',
        text: 'Ancien',
        sourceVersion: 2,
        status: 'approved',
      }),
      { text: 'Source', source: 'publication', variantId: null }
    )
  })

  test('detects stale variants and validates a configurable limit', ({ assert }) => {
    assert.isTrue(isNetworkVariantStale({ sourceVersion: 1, status: 'approved' }, 2))
    assert.isTrue(isNetworkVariantStale({ sourceVersion: 2, status: 'stale' }, 2))
    assert.isFalse(isNetworkVariantStale({ sourceVersion: 2, status: 'draft' }, 2))
    assert.equal(validateNetworkVariantText('  Texte valide  ', 20), 'Texte valide')
    assert.throws(() => validateNetworkVariantText('Texte trop long', 5), NetworkVariantLengthError)
  })
})
