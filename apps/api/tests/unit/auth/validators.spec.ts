import { loginValidator } from '#validators/auth/login_validator'
import { registerValidator } from '#validators/auth/register_validator'
import { test } from '@japa/runner'

test.group('Auth validators', () => {
  test('normalizes login email', async ({ assert }) => {
    const result = await loginValidator.validate({
      email: ' USER@Example.COM ',
      password: 'secret',
    })
    assert.equal(result.email, 'user@example.com')
  })

  test('rejects a short registration password', async ({ assert }) => {
    await assert.rejects(() =>
      registerValidator.validate({
        displayName: 'Martin',
        email: 'martin@example.com',
        password: 'short',
        passwordConfirmation: 'short',
      })
    )
  })

  test('rejects a mismatched password confirmation', async ({ assert }) => {
    await assert.rejects(() =>
      registerValidator.validate({
        displayName: 'Martin',
        email: 'martin@example.com',
        password: 'a-valid-password',
        passwordConfirmation: 'another-password',
      })
    )
  })
})
