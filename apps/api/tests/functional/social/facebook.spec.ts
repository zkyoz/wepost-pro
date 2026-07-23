import AuditLog from '#models/audit_log'
import Project from '#models/project'
import ScheduledPublication from '#models/scheduled_publication'
import SocialAccount from '#models/social_account'
import Publication from '#models/publication'
import User from '#models/user'
import { encryptSocialToken } from '#services/social/token_cipher'
import { facebookPayloadHash } from '#domain/social/facebook'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const agencyId = '80000000-0000-4000-8000-000000000001'
const password = 'correct-horse-battery-staple'
const tokenKey = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY='

async function user(role: 'agency' | 'client', suffix: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@facebook.test`,
    password,
    role,
    agencyId,
    isActive: true,
  })
}

async function project(owner: User, customer: User) {
  const item = await Project.create({
    agencyId,
    name: 'Projet Facebook',
    description: '',
    status: 'active',
    clientUserId: customer.id,
    timezone: 'Europe/Paris',
    createdBy: owner.id,
    archivedAt: null,
  })
  await db.table('project_members').insert({
    project_id: item.id,
    user_id: customer.id,
    membership_role: 'primary',
    created_at: new Date(),
  })
  return item
}

async function approvedPublication(owner: User, parent: Project) {
  return Publication.create({
    agencyId,
    projectId: parent.id,
    title: 'Publication Facebook approuvée',
    baseText: 'Bonjour Facebook',
    status: 'approved',
    targetNetworks: ['facebook'],
    scheduledAt: DateTime.utc().plus({ minutes: 30 }),
    timezone: parent.timezone,
    contentVersion: 2,
    approvedVersion: 2,
    createdBy: owner.id,
    updatedBy: owner.id,
    archivedAt: null,
  })
}

async function account(owner: User) {
  return SocialAccount.create({
    agencyId,
    network: 'facebook',
    externalAccountId: '1234567890',
    externalAccountName: 'Page Facebook de test',
    encryptedAccessToken: encryptSocialToken('page-token', tokenKey),
    encryptedRefreshToken: null,
    expiresAt: DateTime.utc().plus({ days: 30 }),
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
    metadataJson: { pageTasks: ['CREATE_CONTENT'] },
    status: 'connected',
    createdBy: owner.id,
    revokedAt: null,
  })
}

test.group('Facebook publishing HTTP', () => {
  test('connects the explicitly selected managed Page with protected OAuth state', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'oauth')
    const customer = await user('client', 'oauth')
    await project(agency, customer)

    const start = await client
      .post('/api/v1/social/facebook/oauth/start')
      .loginAs(agency)
      .withCsrfToken()
      .json({ pageId: '1234567890' })
    start.assertStatus(200)
    const authorization = new URL(start.body().data.authorizationUrl)

    const callback = await client
      .get(`${authorization.pathname}${authorization.search}`)
      .withSession(start.session())
      .redirects(0)
    callback.assertStatus(302)
    const connected = await SocialAccount.query().where('agencyId', agencyId).firstOrFail()
    assert.equal(connected.externalAccountId, '1234567890')
    assert.notInclude(connected.encryptedAccessToken!, 'mock-page-access-token')
    assert.isNotNull(await AuditLog.query().where('action', 'social.facebook_connected').first())

    const reused = await client
      .get(`${authorization.pathname}${authorization.search}`)
      .withSession(callback.session())
    reused.assertStatus(400)
  })

  test('validates, schedules once and exposes status to the assigned client', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'schedule')
    const customer = await user('client', 'schedule')
    const parent = await project(agency, customer)
    const publication = await approvedPublication(agency, parent)
    const facebook = await account(agency)

    const validation = await client
      .post(`/api/v1/social/facebook/publications/${publication.id}/validate`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: facebook.id })
    validation.assertStatus(200)
    validation.assertBodyContains({ data: { valid: true } })

    const scheduled = await client
      .post(`/api/v1/social/facebook/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: facebook.id, runAt: DateTime.utc().plus({ minutes: 5 }).toISO() })
    scheduled.assertStatus(201)
    scheduled.assertBodyContains({ data: { status: 'queued', publicationVersion: 2 } })

    const duplicate = await client
      .post(`/api/v1/social/facebook/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: facebook.id })
    duplicate.assertStatus(200)
    duplicate.assertBodyContains({ data: { id: scheduled.body().data.id } })

    const status = await client
      .get(`/api/v1/social/facebook/publications/${publication.id}/status`)
      .loginAs(customer)
    status.assertStatus(200)
    status.assertBodyContains({ data: { id: scheduled.body().data.id, status: 'queued' } })
    assert.equal(
      await ScheduledPublication.query()
        .count('* as total')
        .then((r) => Number(r[0].$extras.total)),
      1
    )
  })

  test('denies client mutations and supports audited manual retry and revocation', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'security')
    const customer = await user('client', 'security')
    const parent = await project(agency, customer)
    const publication = await approvedPublication(agency, parent)
    const facebook = await account(agency)

    const denied = await client
      .post(`/api/v1/social/facebook/publications/${publication.id}/schedule`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ accountId: facebook.id })
    denied.assertStatus(403)

    const schedule = await ScheduledPublication.create({
      publicationId: publication.id,
      network: 'facebook',
      accountId: facebook.id,
      publicationVersion: 2,
      runAt: DateTime.utc(),
      status: 'failed',
      idempotencyKey: 'a'.repeat(64),
      payloadHash: facebookPayloadHash({ text: publication.baseText, media: [] }),
    })
    publication.status = 'failed'
    await publication.save()
    const retry = await client
      .post(`/api/v1/social/facebook/schedules/${schedule.id}/retry`)
      .loginAs(agency)
      .withCsrfToken()
    retry.assertStatus(202)
    assert.isNotNull(
      await AuditLog.query().where('action', 'social.facebook_retry_requested').first()
    )

    const revoked = await client
      .delete(`/api/v1/social/facebook/accounts/${facebook.id}`)
      .loginAs(agency)
      .withCsrfToken()
    revoked.assertStatus(200)
    await facebook.refresh()
    assert.equal(facebook.status, 'revoked')
    assert.isNull(facebook.encryptedAccessToken)
  })
})
