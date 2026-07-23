import { hashCalendarFeedToken } from '#services/calendar/calendar_feed_service'
import CalendarFeedToken from '#models/calendar_feed_token'
import Project from '#models/project'
import Publication from '#models/publication'
import User from '#models/user'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const agencyA = '99000000-0000-4000-8000-000000000001'
const agencyB = '99000000-0000-4000-8000-000000000002'
const password = 'correct-horse-battery-staple'

async function user(role: 'agency' | 'client', suffix: string, agencyId: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@feeds.test`,
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

async function publication(owner: User, parent: Project, status: 'scheduled' | 'archived') {
  return Publication.create({
    agencyId: parent.agencyId,
    projectId: parent.id,
    title: 'Planning\r\nBEGIN:VEVENT, test',
    baseText: 'Texte privé qui ne doit pas apparaître',
    status,
    targetNetworks: ['linkedin'],
    scheduledAt: DateTime.fromISO('2026-07-25T08:00:00Z'),
    timezone: parent.timezone,
    contentVersion: status === 'archived' ? 3 : 2,
    approvedVersion: 2,
    createdBy: owner.id,
    updatedBy: owner.id,
    archivedAt: status === 'archived' ? DateTime.utc() : null,
  })
}

test.group('Calendar ICS feeds HTTP', () => {
  test('downloads a scoped ICS and rejects client or foreign project access', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'download', agencyA)
    const customer = await user('client', 'download', agencyA)
    const foreignAgency = await user('agency', 'download-foreign', agencyB)
    const foreignCustomer = await user('client', 'download-foreign', agencyB)
    const parent = await project(agency, customer, 'Projet exporté')
    const foreignParent = await project(foreignAgency, foreignCustomer, 'Projet secret')
    await publication(agency, parent, 'scheduled')
    await publication(agency, parent, 'archived')

    const response = await client
      .get('/api/v1/calendar/export.ics')
      .qs({
        start: '2026-07-01T00:00',
        end: '2026-08-01T00:00',
        timezone: 'Europe/Paris',
        projectId: parent.id,
      })
      .loginAs(agency)
    response.assertStatus(200)
    assert.include(response.header('content-type')!, 'text/calendar')
    assert.equal(response.text().match(/^BEGIN:VEVENT$/gm)?.length, 2)
    assert.include(response.text(), 'STATUS:CANCELLED')
    assert.notInclude(response.text(), 'Texte privé')
    assert.notInclude(response.text(), 'Projet secret')

    const foreign = await client
      .get('/api/v1/calendar/export.ics')
      .qs({
        start: '2026-07-01T00:00',
        end: '2026-08-01T00:00',
        timezone: 'UTC',
        projectId: foreignParent.id,
      })
      .loginAs(agency)
    foreign.assertStatus(404)

    const deniedClient = await client
      .get('/api/v1/calendar/export.ics')
      .qs({ start: '2026-07-01', end: '2026-08-01', timezone: 'UTC' })
      .loginAs(customer)
    deniedClient.assertStatus(403)
  })

  test('creates a hash-only feed, records access and makes revocation immediate', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'subscription', agencyA)
    const customer = await user('client', 'subscription', agencyA)
    const parent = await project(agency, customer, 'Projet abonnement')
    await publication(agency, parent, 'scheduled')

    const created = await client
      .post('/api/v1/calendar/feeds')
      .loginAs(agency)
      .withCsrfToken()
      .json({ projectId: parent.id })
    created.assertStatus(201)
    const body = created.body() as {
      data: { id: string; projectId: string }
      feedPath: string
    }
    const token = body.feedPath.split('/').at(-1)!
    assert.match(token, /^[A-Za-z0-9_-]{64}$/)
    const stored = await CalendarFeedToken.findOrFail(body.data.id)
    assert.equal(stored.tokenHash, hashCalendarFeedToken(token))
    assert.notEqual(stored.tokenHash, token)

    const feed = await client.get(body.feedPath)
    feed.assertStatus(200)
    assert.include(feed.text(), 'Projet abonnement')
    await stored.refresh()
    assert.isNotNull(stored.lastUsedAt)

    const list = await client.get('/api/v1/calendar/feeds').loginAs(agency)
    list.assertStatus(200)
    assert.notInclude(JSON.stringify(list.body()), token)

    const revoked = await client
      .delete(`/api/v1/calendar/feeds/${stored.id}`)
      .loginAs(agency)
      .withCsrfToken()
    revoked.assertStatus(204)
    const afterRevocation = await client.get(body.feedPath)
    afterRevocation.assertStatus(404)
    const unknown = await client.get(`/api/v1/calendar/feeds/${'x'.repeat(64)}`)
    unknown.assertStatus(404)
    const malformed = await client.get('/api/v1/calendar/feeds/short')
    malformed.assertStatus(404)
  })

  test('does not create a feed for a project outside the agency scope', async ({ client }) => {
    const agency = await user('agency', 'idor', agencyA)
    const foreignAgency = await user('agency', 'idor-foreign', agencyB)
    const foreignCustomer = await user('client', 'idor-foreign', agencyB)
    const foreignParent = await project(foreignAgency, foreignCustomer, 'Projet étranger')
    const response = await client
      .post('/api/v1/calendar/feeds')
      .loginAs(agency)
      .withCsrfToken()
      .json({ projectId: foreignParent.id })
    response.assertStatus(404)
  })
})
