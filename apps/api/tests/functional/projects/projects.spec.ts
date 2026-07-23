import AuditLog from '#models/audit_log'
import Project from '#models/project'
import User from '#models/user'
import type { ProjectView } from '#services/projects/project_service'
import { test } from '@japa/runner'

const agencyA = '10000000-0000-4000-8000-000000000001'
const agencyB = '10000000-0000-4000-8000-000000000002'
const password = 'correct-horse-battery-staple'

async function createUser(
  role: 'admin' | 'agency' | 'client',
  suffix: string,
  agencyId: string | null
) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@projects.test`,
    password,
    role,
    agencyId,
    isActive: true,
  })
}

function projectPayload(clientUserId: string, overrides: Record<string, unknown> = {}) {
  return {
    name: 'Campagne été',
    description: 'Projet éditorial principal',
    clientUserId,
    memberUserIds: [],
    timezone: 'Europe/Paris',
    ...overrides,
  }
}

test.group('Projects CRUD', () => {
  test('agency creates, updates, archives and restores its project', async ({ client, assert }) => {
    const agency = await createUser('agency', 'crud', agencyA)
    const customer = await createUser('client', 'crud', agencyA)
    const secondCustomer = await createUser('client', 'crud-second', agencyA)

    const created = await client
      .post('/api/v1/projects')
      .loginAs(agency)
      .withCsrfToken()
      .json(
        projectPayload(customer.id, {
          agencyId: agencyB,
          memberUserIds: [secondCustomer.id],
        })
      )
    created.assertStatus(201)
    const createdBody = created.body() as { data: ProjectView }
    const projectId = createdBody.data.id
    const project = await Project.findOrFail(projectId)
    assert.equal(project.agencyId, agencyA)
    assert.equal(project.status, 'active')

    const listed = await client.get('/api/v1/projects?q=Campagne&status=active').loginAs(agency)
    listed.assertStatus(200)
    assert.equal(listed.body().data.length, 1)
    assert.equal(listed.body().meta.counts.active, 1)

    const updated = await client
      .patch(`/api/v1/projects/${projectId}`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ name: 'Campagne automne' })
    updated.assertStatus(200)
    updated.assertBodyContains({ data: { name: 'Campagne automne' } })

    const reassigned = await client
      .patch(`/api/v1/projects/${projectId}`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ clientUserId: secondCustomer.id })
    reassigned.assertStatus(200)
    reassigned.assertBodyContains({ data: { clientUserId: secondCustomer.id } })

    const archived = await client
      .delete(`/api/v1/projects/${projectId}`)
      .loginAs(agency)
      .withCsrfToken()
    archived.assertStatus(200)
    archived.assertBodyContains({ data: { status: 'archived', canAcceptPublications: false } })

    const blockedUpdate = await client
      .patch(`/api/v1/projects/${projectId}`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ name: 'Modification interdite' })
    blockedUpdate.assertStatus(409)

    const restored = await client
      .post(`/api/v1/projects/${projectId}/restore`)
      .loginAs(agency)
      .withCsrfToken()
    restored.assertStatus(200)
    restored.assertBodyContains({ data: { status: 'active', canAcceptPublications: true } })

    const actions = await AuditLog.query().where('targetProjectId', projectId).orderBy('createdAt')
    assert.deepEqual(
      actions.map(({ action }) => action),
      [
        'project.created',
        'project.updated',
        'project.client_changed',
        'project.archived',
        'project.restored',
      ]
    )
  })

  test('assigned client reads a project but cannot mutate it', async ({ client, assert }) => {
    const agency = await createUser('agency', 'assigned', agencyA)
    const customer = await createUser('client', 'assigned', agencyA)
    const created = await client
      .post('/api/v1/projects')
      .loginAs(agency)
      .withCsrfToken()
      .json(projectPayload(customer.id))
    const createdBody = created.body() as { data: ProjectView }
    const projectId = createdBody.data.id

    const list = await client.get('/api/v1/projects').loginAs(customer)
    list.assertStatus(200)
    const listBody = list.body() as { data: ProjectView[] }
    assert.deepEqual(
      listBody.data.map(({ id }) => id),
      [projectId]
    )
    const detail = await client.get(`/api/v1/projects/${projectId}`).loginAs(customer)
    detail.assertStatus(200)
    const detailBody = detail.body() as { data: ProjectView }
    assert.equal(detailBody.data.members[0].id, customer.id)

    const createDenied = await client
      .post('/api/v1/projects')
      .loginAs(customer)
      .withCsrfToken()
      .json(projectPayload(customer.id))
    const updateDenied = await client
      .patch(`/api/v1/projects/${projectId}`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ name: 'Intrusion' })
    const archiveDenied = await client
      .delete(`/api/v1/projects/${projectId}`)
      .loginAs(customer)
      .withCsrfToken()
    createDenied.assertStatus(403)
    updateDenied.assertStatus(403)
    archiveDenied.assertStatus(403)
  })

  test('hides projects from other clients and agencies', async ({ client, assert }) => {
    const agency = await createUser('agency', 'idor', agencyA)
    const otherAgency = await createUser('agency', 'idor-other', agencyB)
    const assigned = await createUser('client', 'idor-assigned', agencyA)
    const stranger = await createUser('client', 'idor-stranger', agencyA)
    const external = await createUser('client', 'idor-external', agencyB)
    const created = await client
      .post('/api/v1/projects')
      .loginAs(agency)
      .withCsrfToken()
      .json(projectPayload(assigned.id))
    const createdBody = created.body() as { data: ProjectView }
    const projectId = createdBody.data.id

    const strangerList = await client.get('/api/v1/projects').loginAs(stranger)
    strangerList.assertStatus(200)
    const strangerListBody = strangerList.body() as { data: ProjectView[] }
    assert.lengthOf(strangerListBody.data, 0)
    const strangerDetail = await client.get(`/api/v1/projects/${projectId}`).loginAs(stranger)
    strangerDetail.assertStatus(404)
    const externalAgencyDetail = await client
      .get(`/api/v1/projects/${projectId}`)
      .loginAs(otherAgency)
    externalAgencyDetail.assertStatus(404)

    const forgedAssignment = await client
      .post('/api/v1/projects')
      .loginAs(agency)
      .withCsrfToken()
      .json(projectPayload(external.id, { agencyId: agencyA }))
    forgedAssignment.assertStatus(422)
  })

  test('admin manages projects across agencies with pagination', async ({ client, assert }) => {
    const admin = await createUser('admin', 'all', null)
    const customerA = await createUser('client', 'all-a', agencyA)
    const customerB = await createUser('client', 'all-b', agencyB)
    for (const [index, customer] of [customerA, customerB].entries()) {
      const response = await client
        .post('/api/v1/projects')
        .loginAs(admin)
        .withCsrfToken()
        .json(projectPayload(customer.id, { name: `Projet ${index + 1}` }))
      response.assertStatus(201)
    }

    const firstPage = await client.get('/api/v1/projects?page=1&perPage=1').loginAs(admin)
    firstPage.assertStatus(200)
    const firstPageBody = firstPage.body() as {
      data: ProjectView[]
      meta: { total: number; counts: { active: number } }
    }
    assert.lengthOf(firstPageBody.data, 1)
    assert.equal(firstPageBody.meta.total, 2)
    assert.equal(firstPageBody.meta.counts.active, 2)
  })
})
