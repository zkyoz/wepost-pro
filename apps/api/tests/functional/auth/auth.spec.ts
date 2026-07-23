import User from '#models/user'
import { test } from '@japa/runner'

const validRegistration = {
  displayName: 'Martin Barre',
  email: 'Martin.BARRE@Example.com',
  password: 'correct-horse-battery-staple',
  passwordConfirmation: 'correct-horse-battery-staple',
}

test.group('Authentication API', () => {
  test('registers a user, normalizes the email and opens a session', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/auth/register')
      .withCsrfToken()
      .json(validRegistration)
    response.assertStatus(201)
    response.assertBodyContains({
      data: {
        displayName: 'Martin Barre',
        email: 'martin.barre@example.com',
        role: 'client',
        isActive: true,
      },
    })
    response.assertSession('auth_web')
    assert.notProperty(response.body().data, 'password')
  })

  test('rejects a duplicate email after normalization', async ({ client }) => {
    await client.post('/api/v1/auth/register').withCsrfToken().json(validRegistration)
    const response = await client
      .post('/api/v1/auth/register')
      .withCsrfToken()
      .json({ ...validRegistration, email: 'MARTIN.BARRE@example.COM' })
    response.assertStatus(422)
  })

  test('rejects invalid registration input', async ({ client }) => {
    const response = await client
      .post('/api/v1/auth/register')
      .withCsrfToken()
      .json({ displayName: '', email: 'invalid', password: 'short', passwordConfirmation: 'other' })
    response.assertStatus(422)
  })

  test('logs in an active account using the session guard', async ({ client }) => {
    const user = await User.create({
      displayName: 'Martin',
      email: 'martin@example.com',
      password: 'correct-horse-battery-staple',
      role: 'client',
      isActive: true,
    })
    const response = await client
      .post('/api/v1/auth/login')
      .withCsrfToken()
      .json({ email: 'MARTIN@example.com', password: 'correct-horse-battery-staple' })
    response.assertStatus(200)
    response.assertSession('auth_web', user.id)
    response.assertBodyContains({ data: { id: user.id, email: 'martin@example.com' } })
  })

  test('returns the same public error for a wrong password and an unknown email', async ({
    client,
    assert,
  }) => {
    await User.create({
      displayName: 'Martin',
      email: 'martin@example.com',
      password: 'correct-horse-battery-staple',
      role: 'client',
      isActive: true,
    })
    const wrongPassword = await client
      .post('/api/v1/auth/login')
      .withCsrfToken()
      .json({ email: 'martin@example.com', password: 'wrong-password' })
    const unknownEmail = await client
      .post('/api/v1/auth/login')
      .withCsrfToken()
      .json({ email: 'unknown@example.com', password: 'wrong-password' })
    wrongPassword.assertStatus(401)
    unknownEmail.assertStatus(401)
    assert.deepEqual(wrongPassword.body(), unknownEmail.body())
  })

  test('refuses an inactive account without disclosing its state', async ({ client, assert }) => {
    await User.create({
      displayName: 'Inactive',
      email: 'inactive@example.com',
      password: 'correct-horse-battery-staple',
      role: 'client',
      isActive: false,
    })
    const response = await client
      .post('/api/v1/auth/login')
      .withCsrfToken()
      .json({ email: 'inactive@example.com', password: 'correct-horse-battery-staple' })
    response.assertStatus(401)
    assert.deepEqual(response.body(), {
      errors: [{ message: 'Adresse e-mail ou mot de passe incorrect.' }],
    })
  })

  test('returns the current public profile on a protected route', async ({ client }) => {
    const user = await User.create({
      displayName: 'Martin',
      email: 'martin@example.com',
      password: 'correct-horse-battery-staple',
      role: 'client',
      isActive: true,
    })
    const response = await client.get('/api/v1/auth/me').loginAs(user)
    response.assertStatus(200)
    response.assertBodyContains({ data: { id: user.id, displayName: 'Martin' } })
  })

  test('rejects the protected route without a session', async ({ client }) => {
    const response = await client.get('/api/v1/auth/me')
    response.assertStatus(401)
  })

  test('logs out and removes the authentication value from the session', async ({ client }) => {
    const user = await User.create({
      displayName: 'Martin',
      email: 'martin@example.com',
      password: 'correct-horse-battery-staple',
      role: 'client',
      isActive: true,
    })
    const response = await client.post('/api/v1/auth/logout').loginAs(user).withCsrfToken()
    response.assertStatus(200)
    response.assertSessionMissing('auth_web')
    const afterLogout = await client.get('/api/v1/auth/me')
    afterLogout.assertStatus(401)
  })

  test('rejects a mutating request without a CSRF token', async ({ client }) => {
    const response = await client
      .post('/api/v1/auth/login')
      .json({ email: 'unknown@example.com', password: 'anything' })
    response.assertStatus(403)
  })

  test('does not authorize an unknown CORS origin', async ({ client }) => {
    const response = await client
      .options('/api/v1/auth/login')
      .header('Origin', 'https://evil.example')
      .header('Access-Control-Request-Method', 'POST')
    response.assertHeaderMissing('access-control-allow-origin')
  })

  test('rate limits repeated login attempts', async ({ client }) => {
    let response
    for (let attempt = 0; attempt < 11; attempt += 1) {
      response = await client
        .post('/api/v1/auth/login')
        .withCsrfToken()
        .json({ email: 'unknown@example.com', password: 'wrong-password' })
    }
    response!.assertStatus(429)
  })

  test('reports the liveness endpoint', async ({ client }) => {
    const response = await client.get('/health/live')
    response.assertStatus(200)
    response.assertBody({ status: 'ok' })
  })
})
