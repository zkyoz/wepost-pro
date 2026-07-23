import AuditLog from '#models/audit_log'
import Project from '#models/project'
import Publication from '#models/publication'
import PublicationVersion from '#models/publication_version'
import User from '#models/user'
import type { PublicationView } from '#services/publications/publication_service'
import { test } from '@japa/runner'

const agencyA = '20000000-0000-4000-8000-000000000001'
const agencyB = '20000000-0000-4000-8000-000000000002'
const password = 'correct-horse-battery-staple'

async function user(role: 'admin' | 'agency' | 'client', suffix: string, agencyId: string | null) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@publications.test`,
    password,
    role,
    agencyId,
    isActive: true,
  })
}

async function project(owner: User, customer: User, status: 'active' | 'archived' = 'active') {
  const created = await Project.create({
    agencyId: customer.agencyId!,
    name: 'Projet éditorial',
    description: '',
    status,
    clientUserId: customer.id,
    timezone: 'Europe/Paris',
    createdBy: owner.id,
    archivedAt: status === 'archived' ? undefined : null,
  })
  await import('@adonisjs/lucid/services/db').then(({ default: db }) =>
    db.table('project_members').insert({
      project_id: created.id,
      user_id: customer.id,
      membership_role: 'primary',
      created_at: new Date(),
    })
  )
  return created
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Annonce de lancement',
    baseText: 'Voici notre nouvelle campagne.',
    targetNetworks: ['facebook', 'linkedin'],
    scheduledAt: '2026-08-01T09:30',
    timezone: 'Europe/Paris',
    ...overrides,
  }
}

test.group('Publications CRUD', () => {
  test('agency creates, filters, updates, duplicates and archives a publication', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'crud', agencyA)
    const customer = await user('client', 'crud', agencyA)
    const parent = await project(agency, customer)

    const created = await client
      .post(`/api/v1/projects/${parent.id}/publications`)
      .loginAs(agency)
      .withCsrfToken()
      .json(payload({ agencyId: agencyB, status: 'published', contentVersion: 99 }))
    created.assertStatus(201)
    const createdBody = created.body() as { data: PublicationView }
    const publicationId = createdBody.data.id
    assert.equal(createdBody.data.agencyId, agencyA)
    assert.equal(createdBody.data.status, 'draft')
    assert.equal(createdBody.data.contentVersion, 1)

    const list = await client
      .get(`/api/v1/projects/${parent.id}/publications?status=draft&network=linkedin&q=lancement`)
      .loginAs(agency)
    list.assertStatus(200)
    assert.lengthOf(list.body().data, 1)

    const updated = await client
      .patch(`/api/v1/publications/${publicationId}`)
      .loginAs(agency)
      .withCsrfToken()
      .json({
        contentVersion: 1,
        title: 'Annonce mise à jour',
        agencyId: agencyB,
        status: 'published',
      })
    updated.assertStatus(200)
    updated.assertBodyContains({
      data: { title: 'Annonce mise à jour', status: 'draft', contentVersion: 2, agencyId: agencyA },
    })

    const conflict = await client
      .patch(`/api/v1/publications/${publicationId}`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ contentVersion: 1, title: 'Écrasement' })
    conflict.assertStatus(409)
    conflict.assertBodyContains({ meta: { currentVersion: 2 } })

    const duplicate = await client
      .post(`/api/v1/publications/${publicationId}/duplicate`)
      .loginAs(agency)
      .withCsrfToken()
    duplicate.assertStatus(201)
    assert.equal(duplicate.body().data.status, 'draft')
    assert.match(duplicate.body().data.title, /\(copie\)$/)

    const archived = await client
      .post(`/api/v1/publications/${publicationId}/archive`)
      .loginAs(agency)
      .withCsrfToken()
    archived.assertStatus(200)
    archived.assertBodyContains({ data: { status: 'archived' } })

    const detail = await client.get(`/api/v1/publications/${publicationId}`).loginAs(agency)
    detail.assertStatus(200)
    const detailBody = detail.body() as { data: PublicationView }
    assert.deepEqual(
      (detailBody.data.versions ?? []).map(({ version }) => version),
      [2, 1]
    )
    assert.equal(
      await PublicationVersion.query()
        .where('publicationId', publicationId)
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      2
    )
    const persisted = await Publication.findOrFail(publicationId)
    assert.equal(persisted.agencyId, agencyA)
  })

  test('enforces transitions and invalidates an approval after content changes', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'workflow', agencyA)
    const customer = await user('client', 'workflow', agencyA)
    const parent = await project(agency, customer)
    const created = await client
      .post(`/api/v1/projects/${parent.id}/publications`)
      .loginAs(agency)
      .withCsrfToken()
      .json(payload())
    const createdBody = created.body() as { data: PublicationView }
    const publicationId = createdBody.data.id

    const invalid = await client
      .post(`/api/v1/publications/${publicationId}/transition`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ contentVersion: 1, status: 'published' })
    invalid.assertStatus(409)

    for (const status of ['in_progress', 'awaiting_client_review', 'approved'] as const) {
      const transitioned = await client
        .post(`/api/v1/publications/${publicationId}/transition`)
        .loginAs(agency)
        .withCsrfToken()
        .json({ contentVersion: 1, status })
      transitioned.assertStatus(200)
    }
    let publication = await Publication.findOrFail(publicationId)
    assert.equal(publication.status, 'approved')
    assert.equal(publication.approvedVersion, 1)

    const edited = await client
      .patch(`/api/v1/publications/${publicationId}`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ contentVersion: 1, baseText: 'Texte corrigé après approbation.' })
    edited.assertStatus(200)
    edited.assertBodyContains({
      data: { status: 'in_progress', contentVersion: 2, approvedVersion: null },
    })
    publication = await Publication.findOrFail(publicationId)
    assert.equal(publication.status, 'in_progress')
    const transitions = await AuditLog.query()
      .where('targetPublicationId', publicationId)
      .where('action', 'publication.status_changed')
    assert.lengthOf(transitions, 3)
  })

  test('assigned client reads publications but every mutation is denied', async ({ client }) => {
    const agency = await user('agency', 'client-read', agencyA)
    const customer = await user('client', 'client-read', agencyA)
    const parent = await project(agency, customer)
    const created = await client
      .post(`/api/v1/projects/${parent.id}/publications`)
      .loginAs(agency)
      .withCsrfToken()
      .json(payload())
    const createdBody = created.body() as { data: PublicationView }
    const publicationId = createdBody.data.id

    const list = await client.get(`/api/v1/projects/${parent.id}/publications`).loginAs(customer)
    const detail = await client.get(`/api/v1/publications/${publicationId}`).loginAs(customer)
    list.assertStatus(200)
    detail.assertStatus(200)

    const requests = [
      client.post(`/api/v1/projects/${parent.id}/publications`).json(payload()),
      client
        .patch(`/api/v1/publications/${publicationId}`)
        .json({ contentVersion: 1, title: 'Non' }),
      client.post(`/api/v1/publications/${publicationId}/duplicate`),
      client.post(`/api/v1/publications/${publicationId}/archive`),
      client
        .post(`/api/v1/publications/${publicationId}/transition`)
        .json({ contentVersion: 1, status: 'in_progress' }),
    ]
    for (const request of requests) {
      const response = await request.loginAs(customer).withCsrfToken()
      response.assertStatus(403)
    }
  })

  test('hides foreign projects and blocks creation on archived projects', async ({ client }) => {
    const agency = await user('agency', 'idor', agencyA)
    const foreignAgency = await user('agency', 'idor-foreign', agencyB)
    const customer = await user('client', 'idor', agencyA)
    const foreignCustomer = await user('client', 'idor-foreign', agencyB)
    const parent = await project(agency, customer)
    const archivedParent = await project(agency, customer, 'archived')
    const created = await client
      .post(`/api/v1/projects/${parent.id}/publications`)
      .loginAs(agency)
      .withCsrfToken()
      .json(payload())
    const createdBody = created.body() as { data: PublicationView }

    const foreignList = await client
      .get(`/api/v1/projects/${parent.id}/publications`)
      .loginAs(foreignAgency)
    const foreignDetail = await client
      .get(`/api/v1/publications/${createdBody.data.id}`)
      .loginAs(foreignAgency)
    foreignList.assertStatus(404)
    foreignDetail.assertStatus(404)

    const blocked = await client
      .post(`/api/v1/projects/${archivedParent.id}/publications`)
      .loginAs(agency)
      .withCsrfToken()
      .json(payload())
    blocked.assertStatus(409)

    const foreignParent = await project(foreignAgency, foreignCustomer)
    const forged = await client
      .post(`/api/v1/projects/${foreignParent.id}/publications`)
      .loginAs(agency)
      .withCsrfToken()
      .json(payload({ agencyId: agencyA }))
    forged.assertStatus(404)
  })
})
