import { isAppLocale, isTranslationStale, translationSourceHash } from '#domain/i18n/locale'
import { test } from '@japa/runner'

test.group('Locales and translation versions', () => {
  test('accepts only supported locales', ({ assert }) => {
    assert.isTrue(isAppLocale('fr'))
    assert.isTrue(isAppLocale('en'))
    assert.isFalse(isAppLocale('es'))
  })

  test('hashes normalized source text and detects stale translations', ({ assert }) => {
    const source = 'Publication café'
    const hash = translationSourceHash(source)
    assert.equal(hash, translationSourceHash(source.normalize('NFD')))
    assert.isFalse(isTranslationStale(3, hash, 3, source))
    assert.isTrue(isTranslationStale(3, hash, 4, source))
    assert.isTrue(isTranslationStale(3, hash, 3, `${source} modifiée`))
  })
})
