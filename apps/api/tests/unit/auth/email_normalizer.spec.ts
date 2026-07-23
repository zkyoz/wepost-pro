import { normalizeEmail } from '#services/auth/email_normalizer'
import { test } from '@japa/runner'

test.group('Email normalization', () => {
  test('trims whitespace and lowercases an email', ({ assert }) => {
    assert.equal(normalizeEmail('  Martin.BARRE@Example.COM  '), 'martin.barre@example.com')
  })
})
