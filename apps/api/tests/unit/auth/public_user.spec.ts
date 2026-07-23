import User from '#models/user'
import { toPublicUser } from '#services/auth/public_user'
import { DateTime } from 'luxon'
import { test } from '@japa/runner'

test.group('Public user mapping', () => {
  test('exposes only public profile properties', ({ assert }) => {
    const user = new User()
    user.id = '8fc4e41c-6298-48d3-bfe2-d4ea9c18e2c2'
    user.agencyId = null
    user.email = 'martin@example.com'
    user.password = 'never-serialize-this'
    user.displayName = 'Martin Barre'
    user.role = 'client'
    user.locale = 'fr'
    user.isActive = true
    user.createdAt = DateTime.fromISO('2026-07-22T10:00:00Z')
    user.updatedAt = DateTime.fromISO('2026-07-22T10:00:00Z')

    const profile = toPublicUser(user)
    assert.notProperty(profile, 'password')
    assert.equal(profile.initials, 'MB')
    assert.equal(profile.email, 'martin@example.com')
    assert.equal(profile.locale, 'fr')
    assert.notProperty(user.serialize(), 'password')
  })
})
