import {
  assertActiveAdminRemains,
  LastActiveAdminError,
  redactSensitive,
} from '#domain/admin/admin_guards'
import { test } from '@japa/runner'

test.group('Admin safeguards', () => {
  test('blocks removal of the last active administrator', ({ assert }) => {
    assert.throws(
      () =>
        assertActiveAdminRemains({
          targetRole: 'admin',
          targetIsActive: true,
          nextRole: 'client',
          nextIsActive: true,
          activeAdminCount: 1,
        }),
      LastActiveAdminError
    )
  })

  test('allows a change when another active administrator remains', ({ assert }) => {
    assert.doesNotThrow(() =>
      assertActiveAdminRemains({
        targetRole: 'admin',
        targetIsActive: true,
        nextRole: 'agency',
        nextIsActive: true,
        activeAdminCount: 2,
      })
    )
  })

  test('redacts nested credentials without changing ordinary metadata', ({ assert }) => {
    assert.deepEqual(
      redactSensitive({ account: 'page', accessToken: 'secret', nested: { cookie: 'value' } }),
      { account: 'page', accessToken: '[REDACTED]', nested: { cookie: '[REDACTED]' } }
    )
  })
})
