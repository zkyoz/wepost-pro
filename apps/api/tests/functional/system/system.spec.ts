import User from '#models/user'
import { test } from '@japa/runner'

async function user(role: 'admin' | 'agency' | 'client', suffix: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@system.test`,
    password: 'correct-horse-battery-staple',
    role,
    agencyId: role === 'admin' ? null : '00000000-0000-4000-8000-000000000001',
    isActive: true,
  })
}

test.group('System supervision', () => {
  test('reports readiness and a correlation id without requiring authentication', async ({
    client,
  }) => {
    const response = await client
      .get('/health/ready')
      .header('x-correlation-id', 'test-correlation-21')
    response.assertStatus(200)
    response.assertBodyContains({ status: 'ready', ready: true })
    response.assertHeader('x-correlation-id', 'test-correlation-21')
  })

  test('returns redacted system details and metrics only to an administrator', async ({
    client,
    assert,
  }) => {
    const admin = await user('admin', 'status')
    const status = await client.get('/api/v1/admin/system/status').loginAs(admin)
    const metrics = await client.get('/api/v1/admin/system/metrics').loginAs(admin)
    status.assertStatus(200)
    metrics.assertStatus(200)
    status.assertBodyContains({
      data: {
        environment: 'test',
        components: [{ id: 'api', status: 'operational' }],
      },
    })
    assert.notInclude(JSON.stringify(status.body()), 'REDIS_PASSWORD')
    assert.notInclude(JSON.stringify(status.body()), 'accessToken')
    assert.isNumber(metrics.body().data.metrics.http.requestCount)
  })

  test('denies system details to agency, client and anonymous requests', async ({ client }) => {
    const agency = await user('agency', 'denied')
    const customer = await user('client', 'denied')
    await client.get('/api/v1/admin/system/status').then((response) => response.assertStatus(401))
    for (const actor of [agency, customer]) {
      await client
        .get('/api/v1/admin/system/status')
        .loginAs(actor)
        .then((response) => response.assertStatus(403))
    }
  })

  test('limits retry to failed persistent jobs', async ({ client }) => {
    const admin = await user('admin', 'retry')
    const response = await client
      .post('/api/v1/admin/system/jobs/job-1/retry')
      .loginAs(admin)
      .withCsrfToken()
    response.assertStatus(503)
    response.assertBodyContains({
      errors: [{ message: 'La file persistante est indisponible dans cet environnement.' }],
    })
  })
})
