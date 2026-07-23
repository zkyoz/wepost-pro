import { canAccessProject, canViewUser } from '#domain/auth/resource_scope'
import type User from '#models/user'
import { test } from '@japa/runner'

const agencyA = '00000000-0000-4000-8000-000000000001'
const agencyB = '00000000-0000-4000-8000-000000000002'

function user(id: string, role: 'admin' | 'agency' | 'client', agencyId: string | null) {
  return { id, role, agencyId } as User
}

test.group('Resource scopes', () => {
  test('admin accesses every project scope', ({ assert }) => {
    assert.isTrue(
      canAccessProject(user('admin', 'admin', null), { agencyId: agencyB, memberUserIds: [] })
    )
  })

  test('agency is limited to its agency', ({ assert }) => {
    const actor = user('agency', 'agency', agencyA)
    assert.isTrue(canAccessProject(actor, { agencyId: agencyA, memberUserIds: [] }))
    assert.isFalse(canAccessProject(actor, { agencyId: agencyB, memberUserIds: [] }))
  })

  test('client must belong to the agency and project membership', ({ assert }) => {
    const actor = user('client-a', 'client', agencyA)
    assert.isTrue(canAccessProject(actor, { agencyId: agencyA, memberUserIds: ['client-a'] }))
    assert.isFalse(canAccessProject(actor, { agencyId: agencyA, memberUserIds: ['client-b'] }))
    assert.isFalse(canAccessProject(actor, { agencyId: agencyB, memberUserIds: ['client-a'] }))
  })

  test('user visibility hides resources outside the authorized scope', ({ assert }) => {
    const clientA = user('client-a', 'client', agencyA)
    const clientB = user('client-b', 'client', agencyA)
    const agency = user('agency', 'agency', agencyA)
    const external = user('external', 'client', agencyB)
    assert.isTrue(canViewUser(clientA, clientA))
    assert.isFalse(canViewUser(clientA, clientB))
    assert.isTrue(canViewUser(agency, clientB))
    assert.isFalse(canViewUser(agency, external))
  })
})
