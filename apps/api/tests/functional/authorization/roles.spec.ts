import AuditLog from '#models/audit_log'
import User from '#models/user'
import { test } from '@japa/runner'

const agencyA = '00000000-0000-4000-8000-000000000001'
const agencyB = '00000000-0000-4000-8000-000000000002'

async function createUser(
  role: 'admin' | 'agency' | 'client',
  suffix: string,
  agencyId: string | null = agencyA
) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@example.test`,
    password: 'correct-horse-battery-staple',
    role,
    agencyId: role === 'admin' ? null : agencyId,
    isActive: true,
  })
}

test.group('Role authorization HTTP', () => {
  test('only an admin can list users', async ({ client }) => {
    const admin = await createUser('admin', 'list')
    const agency = await createUser('agency', 'list')
    const customer = await createUser('client', 'list')

    const allowed = await client.get('/api/v1/admin/users').loginAs(admin)
    allowed.assertStatus(200)
    allowed.assertBodyContains({ data: [{ id: admin.id }] })
    const agencyResponse = await client.get('/api/v1/admin/users').loginAs(agency)
    const customerResponse = await client.get('/api/v1/admin/users').loginAs(customer)
    agencyResponse.assertStatus(403)
    customerResponse.assertStatus(403)
  })

  test('admin changes a role and creates an immutable audit record', async ({ client, assert }) => {
    const admin = await createUser('admin', 'role')
    const target = await createUser('client', 'role')
    const response = await client
      .patch(`/api/v1/admin/users/${target.id}/role`)
      .loginAs(admin)
      .withCsrfToken()
      .json({ role: 'agency' })
    response.assertStatus(200)
    response.assertBodyContains({ data: { id: target.id, role: 'agency' } })
    await target.refresh()
    assert.equal(target.role, 'agency')
    const audit = await AuditLog.query().where('targetUserId', target.id).firstOrFail()
    assert.equal(audit.action, 'user.role_changed')
    assert.deepEqual(audit.previousValues, { role: 'client' })
    assert.deepEqual(audit.nextValues, { role: 'agency' })
  })

  test('rejects an invalid role and non-admin role changes', async ({ client }) => {
    const admin = await createUser('admin', 'validation')
    const agency = await createUser('agency', 'validation')
    const target = await createUser('client', 'validation')
    const invalidRolePayload = { role: 'owner' } as unknown as {
      role: 'admin' | 'agency' | 'client'
    }

    const invalidRoleResponse = await client
      .patch(`/api/v1/admin/users/${target.id}/role`)
      .loginAs(admin)
      .withCsrfToken()
      .json(invalidRolePayload)
    const forbiddenResponse = await client
      .patch(`/api/v1/admin/users/${target.id}/role`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ role: 'admin' })
    invalidRoleResponse.assertStatus(422)
    forbiddenResponse.assertStatus(403)
  })

  test('admin cannot change its own role or status', async ({ client }) => {
    const admin = await createUser('admin', 'self')
    const roleResponse = await client
      .patch(`/api/v1/admin/users/${admin.id}/role`)
      .loginAs(admin)
      .withCsrfToken()
      .json({ role: 'client' })
    const statusResponse = await client
      .patch(`/api/v1/admin/users/${admin.id}/status`)
      .loginAs(admin)
      .withCsrfToken()
      .json({ isActive: false })
    roleResponse.assertStatus(403)
    statusResponse.assertStatus(403)
  })

  test('deactivation is audited and invalidates an existing session', async ({
    client,
    assert,
  }) => {
    const admin = await createUser('admin', 'status')
    const target = await createUser('client', 'status')
    const response = await client
      .patch(`/api/v1/admin/users/${target.id}/status`)
      .loginAs(admin)
      .withCsrfToken()
      .json({ isActive: false })
    response.assertStatus(200)
    await target.refresh()
    assert.isFalse(target.isActive)
    const audit = await AuditLog.query().where('targetUserId', target.id).firstOrFail()
    assert.equal(audit.action, 'user.deactivated')

    const protectedResponse = await client.get('/api/v1/auth/me').loginAs(target)
    protectedResponse.assertStatus(401)
    protectedResponse.assertSessionMissing('auth_web')
  })

  test('client receives 404 for another client resource', async ({ client }) => {
    const actor = await createUser('client', 'idor-actor')
    const target = await createUser('client', 'idor-target')
    const ownResponse = await client.get(`/api/v1/users/${actor.id}`).loginAs(actor)
    const otherResponse = await client.get(`/api/v1/users/${target.id}`).loginAs(actor)
    ownResponse.assertStatus(200)
    otherResponse.assertStatus(404)
  })

  test('agency sees only users from its agency', async ({ client }) => {
    const actor = await createUser('agency', 'scope', agencyA)
    const local = await createUser('client', 'scope-local', agencyA)
    const external = await createUser('client', 'scope-external', agencyB)
    const localResponse = await client.get(`/api/v1/users/${local.id}`).loginAs(actor)
    const externalResponse = await client.get(`/api/v1/users/${external.id}`).loginAs(actor)
    localResponse.assertStatus(200)
    externalResponse.assertStatus(404)
  })
})
