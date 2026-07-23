import { SUPERVISION_CATEGORIES } from '#domain/supervision/supervision'
import Notification from '#models/notification'
import Project from '#models/project'
import Publication from '#models/publication'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'

const agencyA = '00000000-0000-4000-8000-000000000014'
const agencyB = '00000000-0000-4000-8000-000000000015'

async function user(role: 'admin' | 'agency' | 'client', suffix: string, agencyId: string | null) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@supervision.test`,
    password: 'correct-horse-battery-staple',
    role,
    agencyId,
    isActive: true,
  })
}

async function project(owner: User, client: User, name: string) {
  return Project.create({
    agencyId: owner.agencyId!,
    name,
    description: 'Projet de supervision',
    status: 'active',
    clientUserId: client.id,
    timezone: 'Europe/Paris',
    createdBy: owner.id,
  })
}

async function publication(
  owner: User,
  projectId: string,
  status: Publication['status'],
  index: number
) {
  return Publication.create({
    agencyId: owner.agencyId!,
    projectId,
    title: `Publication ${status} ${index}`,
    baseText: 'Contenu de supervision',
    status,
    targetNetworks: index % 2 ? ['linkedin'] : ['facebook'],
    scheduledAt: DateTime.utc().plus({ days: index }),
    timezone: 'Europe/Paris',
    contentVersion: 1,
    approvedVersion: ['scheduled', 'published', 'failed'].includes(status) ? 1 : null,
    createdBy: owner.id,
    updatedBy: owner.id,
    archivedAt: null,
  })
}

test.group('Agency supervision HTTP', () => {
  test('keeps counters, lists and filters coherent inside the agency scope', async ({
    client,
    assert,
  }) => {
    const owner = await user('agency', 'coherent', agencyA)
    const customer = await user('client', 'coherent', agencyA)
    const outsider = await user('agency', 'outside', agencyB)
    const outsideCustomer = await user('client', 'outside', agencyB)
    const ownedProject = await project(owner, customer, 'Projet visible')
    const outsideProject = await project(outsider, outsideCustomer, 'Projet invisible')
    const statuses = [
      'awaiting_client_review',
      'changes_requested',
      'scheduled',
      'published',
      'failed',
    ] as const
    const publications = await Promise.all(
      statuses.map((status, index) => publication(owner, ownedProject.id, status, index))
    )
    await publication(outsider, outsideProject.id, 'failed', 20)
    const unread = await Notification.create({
      userId: owner.id,
      type: 'publication.comment_created',
      payloadJson: { publicationId: publications[0].id, projectId: ownedProject.id },
      readAt: null,
      emailStatus: 'pending',
      emailJobId: null,
      emailAttempts: 0,
      emailLastError: null,
      emailedAt: null,
    })

    const summary = await client.get('/api/v1/supervision/summary').loginAs(owner)
    summary.assertStatus(200)
    summary.assertBodyContains({
      data: {
        counts: {
          unread_comments: 1,
          awaiting_client_review: 1,
          changes_requested: 1,
          scheduled: 1,
          published: 1,
          failed: 1,
        },
        actionRequired: 4,
      },
    })
    assert.notInclude(JSON.stringify(summary.body()), outsideCustomer.id)

    for (const category of SUPERVISION_CATEGORIES) {
      const list = await client
        .get('/api/v1/supervision/items')
        .qs({ category, perPage: 10 })
        .loginAs(owner)
      list.assertStatus(200)
      assert.equal(list.body().meta.total, summary.body().data.counts[category])
    }

    const filtered = await client
      .get('/api/v1/supervision/summary')
      .qs({ network: 'linkedin', projectId: ownedProject.id, responsibleId: owner.id })
      .loginAs(owner)
    filtered.assertStatus(200)
    assert.equal(filtered.body().data.counts.scheduled, 0)
    assert.equal(filtered.body().data.counts.changes_requested, 1)

    const forgedScope = await client
      .get('/api/v1/supervision/summary')
      .qs({ clientId: outsideCustomer.id })
      .loginAs(owner)
    forgedScope.assertStatus(200)
    assert.deepEqual(Object.values(forgedScope.body().data.counts), [0, 0, 0, 0, 0, 0])

    await client
      .patch(`/api/v1/supervision/notifications/${unread.id}/read`)
      .loginAs(owner)
      .withCsrfToken()
      .then((response) => response.assertStatus(200))
    await unread.refresh()
    assert.isNotNull(unread.readAt)
    const afterRead = await client.get('/api/v1/supervision/summary').loginAs(owner)
    assert.equal(afterRead.body().data.counts.unread_comments, 0)
  })

  test('denies clients and hides notification identifiers from other agency users', async ({
    client,
  }) => {
    const owner = await user('agency', 'secure', agencyA)
    const customer = await user('client', 'secure', agencyA)
    const otherAgency = await user('agency', 'secure-other', agencyB)
    const ownedProject = await project(owner, customer, 'Projet sécurisé')
    const item = await publication(owner, ownedProject.id, 'awaiting_client_review', 1)
    const notification = await Notification.create({
      userId: owner.id,
      type: 'publication.comment_created',
      payloadJson: { publicationId: item.id, projectId: ownedProject.id },
      readAt: null,
      emailStatus: 'pending',
      emailJobId: null,
      emailAttempts: 0,
      emailLastError: null,
      emailedAt: null,
    })

    await client
      .get('/api/v1/supervision/summary')
      .loginAs(customer)
      .then((r) => r.assertStatus(403))
    await client
      .get('/api/v1/supervision/items')
      .qs({ category: 'unread_comments' })
      .loginAs(customer)
      .then((r) => r.assertStatus(403))
    await client
      .patch(`/api/v1/supervision/notifications/${notification.id}/read`)
      .loginAs(customer)
      .withCsrfToken()
      .then((r) => r.assertStatus(403))
    await client
      .patch(`/api/v1/supervision/notifications/${notification.id}/read`)
      .loginAs(otherAgency)
      .withCsrfToken()
      .then((r) => r.assertStatus(404))
  })

  test('answers below the CRUD target on 20 clients and 800 publications', async ({
    client,
    assert,
  }) => {
    const owner = await user('agency', 'volume', agencyA)
    const customer = await user('client', 'volume', agencyA)
    const now = DateTime.utc().toSQL()!
    const projectRows = Array.from({ length: 20 }, (_, index) => ({
      id: randomUUID(),
      agency_id: agencyA,
      name: `Projet volumétrie ${index}`,
      description: '',
      status: 'active',
      client_user_id: customer.id,
      timezone: 'Europe/Paris',
      created_by: owner.id,
      created_at: now,
      updated_at: now,
      archived_at: null,
    }))
    await db.table('projects').insert(projectRows)
    await db.table('publications').insert(
      projectRows.flatMap((row, projectIndex) =>
        Array.from({ length: 40 }, (_, publicationIndex) => ({
          id: randomUUID(),
          agency_id: agencyA,
          project_id: row.id,
          title: `Publication ${projectIndex}-${publicationIndex}`,
          base_text: '',
          status: publicationIndex % 2 ? 'scheduled' : 'awaiting_client_review',
          target_networks: ['facebook'],
          scheduled_at: now,
          timezone: 'Europe/Paris',
          content_version: 1,
          approved_version: publicationIndex % 2 ? 1 : null,
          created_by: owner.id,
          updated_by: owner.id,
          created_at: now,
          updated_at: now,
          archived_at: null,
        }))
      )
    )

    const response = await client.get('/api/v1/supervision/summary').loginAs(owner)
    response.assertStatus(200)
    assert.equal(response.body().data.counts.scheduled, 400)
    assert.equal(response.body().data.counts.awaiting_client_review, 400)
    assert.isBelow(response.body().meta.durationMs, 500)
  })
})
