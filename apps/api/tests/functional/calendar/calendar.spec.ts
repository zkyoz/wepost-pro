import AuditLog from '#models/audit_log'
import Project from '#models/project'
import Publication from '#models/publication'
import PublicationVersion from '#models/publication_version'
import User from '#models/user'
import type { PublicationView } from '#services/publications/publication_service'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const agencyA = '40000000-0000-4000-8000-000000000001'
const agencyB = '40000000-0000-4000-8000-000000000002'
const password = 'correct-horse-battery-staple'

async function user(role: 'agency' | 'client', suffix: string, agencyId: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@calendar.test`,
    password,
    role,
    agencyId,
    isActive: true,
  })
}

async function project(owner: User, customer: User, name: string) {
  const created = await Project.create({
    agencyId: customer.agencyId!,
    name,
    description: '',
    status: 'active',
    clientUserId: customer.id,
    timezone: 'Europe/Paris',
    createdBy: owner.id,
    archivedAt: null,
  })
  await db.table('project_members').insert({
    project_id: created.id,
    user_id: customer.id,
    membership_role: 'primary',
    created_at: new Date(),
  })
  return created
}

async function publication(
  owner: User,
  parent: Project,
  title: string,
  scheduledAt: string | null,
  overrides: Partial<Publication> = {}
) {
  return Publication.create({
    agencyId: parent.agencyId,
    projectId: parent.id,
    title,
    baseText: 'Texte calendrier',
    status: 'draft',
    targetNetworks: ['linkedin'],
    scheduledAt: scheduledAt ? DateTime.fromISO(scheduledAt, { zone: 'utc' }) : null,
    timezone: parent.timezone,
    contentVersion: 1,
    approvedVersion: null,
    createdBy: owner.id,
    updatedBy: owner.id,
    archivedAt: null,
    ...overrides,
  })
}

test.group('Editorial calendar HTTP', () => {
  test('returns a scoped range, undated publications and validated filters', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'list', agencyA)
    const customer = await user('client', 'list', agencyA)
    const foreignAgency = await user('agency', 'list-foreign', agencyB)
    const foreignCustomer = await user('client', 'list-foreign', agencyB)
    const parent = await project(agency, customer, 'Projet visible')
    const foreignParent = await project(foreignAgency, foreignCustomer, 'Projet secret')
    await publication(agency, parent, 'Publication datée', '2026-07-10T08:00:00Z')
    await publication(agency, parent, 'Publication sans date', null, {
      targetNetworks: ['facebook'],
    })
    await publication(foreignAgency, foreignParent, 'Publication étrangère', '2026-07-10T08:00:00Z')

    const response = await client
      .get('/api/v1/calendar')
      .qs({
        start: '2026-07-01T00:00',
        end: '2026-08-01T00:00',
        timezone: 'Europe/Paris',
        projectId: parent.id,
        clientId: customer.id,
        status: 'draft',
        network: 'linkedin',
        includeUndated: true,
      })
      .loginAs(customer)
    response.assertStatus(200)
    const body = response.body() as {
      data: Array<PublicationView & { projectName: string; clientName: string }>
      meta: { total: number; timezone: string; durationMs: number }
      filters: { projects: Array<{ id: string }>; clients: Array<{ id: string }> }
    }
    assert.deepEqual(
      body.data.map((item) => item.title),
      ['Publication datée']
    )
    assert.equal(body.data[0]!.projectName, 'Projet visible')
    assert.equal(body.meta.timezone, 'Europe/Paris')
    assert.isAtLeast(body.meta.durationMs, 0)
    assert.deepEqual(
      body.filters.projects.map(({ id }) => id),
      [parent.id]
    )

    const withUndated = await client
      .get('/api/v1/calendar')
      .qs({
        start: '2026-07-01T00:00',
        end: '2026-08-01T00:00',
        timezone: 'Europe/Paris',
      })
      .loginAs(customer)
    withUndated.assertStatus(200)
    assert.deepEqual(
      (withUndated.body().data as Array<{ title: string }>).map(({ title }) => title),
      ['Publication datée', 'Publication sans date']
    )
  })

  test('moves with optimistic locking while preserving approval and status', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'move', agencyA)
    const customer = await user('client', 'move', agencyA)
    const parent = await project(agency, customer, 'Projet déplacement')
    const item = await publication(agency, parent, 'Publication approuvée', null, {
      status: 'approved',
      contentVersion: 3,
      approvedVersion: 3,
    })

    const moved = await client
      .post(`/api/v1/publications/${item.id}/calendar/move`)
      .loginAs(agency)
      .withCsrfToken()
      .json({
        contentVersion: 3,
        scheduledAt: '2026-10-26T09:30',
        timezone: 'Europe/Paris',
      })
    moved.assertStatus(200)
    moved.assertBodyContains({
      data: { status: 'approved', contentVersion: 4, approvedVersion: 3 },
    })
    const movedBody = moved.body() as { data: PublicationView }
    assert.equal(movedBody.data.scheduledAt, '2026-10-26T08:30:00.000Z')
    assert.isNotNull(
      await PublicationVersion.query().where('publicationId', item.id).where('version', 4).first()
    )
    assert.isNotNull(
      await AuditLog.query()
        .where('targetPublicationId', item.id)
        .where('action', 'publication.calendar_moved')
        .first()
    )

    const stale = await client
      .post(`/api/v1/publications/${item.id}/calendar/move`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ contentVersion: 3, scheduledAt: null, timezone: 'Europe/Paris' })
    stale.assertStatus(409)
    stale.assertBodyContains({ meta: { currentVersion: 4 } })

    const denied = await client
      .post(`/api/v1/publications/${item.id}/calendar/move`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ contentVersion: 4, scheduledAt: null, timezone: 'Europe/Paris' })
    denied.assertStatus(403)
  })

  test('rejects invalid ranges, nonexistent DST time and foreign resources', async ({ client }) => {
    const agency = await user('agency', 'security', agencyA)
    const customer = await user('client', 'security', agencyA)
    const foreignAgency = await user('agency', 'security-foreign', agencyB)
    const parent = await project(agency, customer, 'Projet sécurisé')
    const item = await publication(agency, parent, 'Publication protégée', null)

    const oversized = await client
      .get('/api/v1/calendar')
      .qs({ start: '2026-01-01T00:00', end: '2027-02-01T00:00', timezone: 'UTC' })
      .loginAs(agency)
    oversized.assertStatus(422)

    const dstGap = await client
      .post(`/api/v1/publications/${item.id}/calendar/move`)
      .loginAs(agency)
      .withCsrfToken()
      .json({
        contentVersion: 1,
        scheduledAt: '2026-03-29T02:30',
        timezone: 'Europe/Paris',
      })
    dstGap.assertStatus(422)

    const foreignMove = await client
      .post(`/api/v1/publications/${item.id}/calendar/move`)
      .loginAs(foreignAgency)
      .withCsrfToken()
      .json({ contentVersion: 1, scheduledAt: null, timezone: 'UTC' })
    foreignMove.assertStatus(404)
  })
})
