import AuditLog from '#models/audit_log'
import MediaAsset from '#models/media_asset'
import Project from '#models/project'
import PublicationMedia from '#models/publication_media'
import ScheduledPublication from '#models/scheduled_publication'
import SocialAccount from '#models/social_account'
import Publication from '#models/publication'
import User from '#models/user'
import { encryptSocialToken } from '#services/social/token_cipher'
import { pinterestPayloadHash } from '#domain/social/pinterest'
import { markSocialScheduleFailed } from '#services/social/social_status_service'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { createHash, randomUUID } from 'node:crypto'

const agencyId = '80000000-0000-4000-8000-000000000001'
const password = 'correct-horse-battery-staple'
const tokenKey = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY='
const pin = {
  boardId: '123456789',
  title: 'Campagne Pinterest',
  description: 'Bonjour Pinterest',
  link: 'https://wepost.pro/campagne',
}

async function user(role: 'agency' | 'client', suffix: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@pinterest.test`,
    password,
    role,
    agencyId,
    isActive: true,
  })
}

async function project(owner: User, customer: User) {
  const item = await Project.create({
    agencyId,
    name: 'Projet Pinterest',
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
  const publication = await Publication.create({
    agencyId,
    projectId: parent.id,
    title: 'Publication Pinterest approuvée',
    baseText: 'Bonjour Pinterest',
    status: 'approved',
    targetNetworks: ['pinterest'],
    scheduledAt: DateTime.utc().plus({ minutes: 30 }),
    timezone: parent.timezone,
    contentVersion: 2,
    approvedVersion: 2,
    createdBy: owner.id,
    updatedBy: owner.id,
    archivedAt: null,
  })
  const media = await MediaAsset.create({
    agencyId,
    uploaderId: owner.id,
    storageKey: `test/${randomUUID()}.jpg`,
    originalName: 'pinterest.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 4,
    checksum: createHash('sha256').update('jpeg').digest('hex'),
    width: 1080,
    height: 1080,
    durationMs: null,
    altText: 'Visuel Pinterest',
    isDecorative: false,
    scanStatus: 'clean',
    uploadExpiresAt: DateTime.utc().plus({ hours: 1 }),
    deletedAt: null,
  })
  await PublicationMedia.create({ publicationId: publication.id, mediaId: media.id, position: 0 })
  return publication
}

async function account(owner: User) {
  return SocialAccount.create({
    agencyId,
    network: 'pinterest',
    externalAccountId: '987654321',
    externalAccountName: 'wepost_test',
    encryptedAccessToken: encryptSocialToken('page-token', tokenKey),
    encryptedRefreshToken: null,
    expiresAt: DateTime.utc().plus({ days: 30 }),
    scopes: ['user_accounts:read', 'boards:read', 'pins:read', 'pins:write'],
    metadataJson: { boards: [{ id: '123456789', name: 'Campagnes', privacy: 'PUBLIC' }] },
    status: 'connected',
    createdBy: owner.id,
    revokedAt: null,
  })
}

test.group('Pinterest publishing HTTP', () => {
  test('connects the Pinterest account and loads its boards with protected OAuth state', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'oauth')
    const customer = await user('client', 'oauth')
    await project(agency, customer)

    const start = await client
      .post('/api/v1/social/pinterest/oauth/start')
      .loginAs(agency)
      .withCsrfToken()
      .json({})
    start.assertStatus(200)
    const authorization = new URL(start.body().data.authorizationUrl)

    const callback = await client
      .get(`${authorization.pathname}${authorization.search}`)
      .withSession(start.session())
      .redirects(0)
    callback.assertStatus(302)
    const connected = await SocialAccount.query().where('agencyId', agencyId).firstOrFail()
    assert.equal(connected.externalAccountId, '987654321')
    assert.deepInclude(connected.metadataJson, {
      boards: [{ id: '123456789', name: 'Campagnes', privacy: 'PUBLIC' }],
    })
    assert.notInclude(connected.encryptedAccessToken!, 'mock-pinterest-access-token')
    assert.isNotNull(await AuditLog.query().where('action', 'social.pinterest_connected').first())

    const refreshed = await client
      .post(`/api/v1/social/pinterest/accounts/${connected.id}/refresh`)
      .loginAs(agency)
      .withCsrfToken()
    refreshed.assertStatus(200)
    assert.isNotNull(await AuditLog.query().where('action', 'social.pinterest_refreshed').first())

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
    const pinterest = await account(agency)

    const validation = await client
      .post(`/api/v1/social/pinterest/publications/${publication.id}/validate`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: pinterest.id, ...pin })
    validation.assertStatus(200)
    validation.assertBodyContains({ data: { valid: true } })

    const scheduled = await client
      .post(`/api/v1/social/pinterest/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: pinterest.id, ...pin, runAt: DateTime.utc().plus({ minutes: 5 }).toISO() })
    scheduled.assertStatus(201)
    scheduled.assertBodyContains({ data: { status: 'queued', publicationVersion: 2 } })

    const duplicate = await client
      .post(`/api/v1/social/pinterest/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: pinterest.id, ...pin })
    duplicate.assertStatus(200)
    duplicate.assertBodyContains({ data: { id: scheduled.body().data.id } })

    const status = await client
      .get(`/api/v1/social/pinterest/publications/${publication.id}/status`)
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
    const pinterest = await account(agency)

    const denied = await client
      .post(`/api/v1/social/pinterest/publications/${publication.id}/schedule`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ accountId: pinterest.id, ...pin })
    denied.assertStatus(403)

    const schedule = await ScheduledPublication.create({
      publicationId: publication.id,
      network: 'pinterest',
      accountId: pinterest.id,
      publicationVersion: 2,
      runAt: DateTime.utc(),
      status: 'failed',
      idempotencyKey: 'a'.repeat(64),
      networkPayloadJson: pin,
      payloadHash: pinterestPayloadHash({ pin, media: [] }),
    })
    publication.status = 'failed'
    await publication.save()
    const retry = await client
      .post(`/api/v1/social/pinterest/schedules/${schedule.id}/retry`)
      .loginAs(agency)
      .withCsrfToken()
    retry.assertStatus(202)
    assert.isNotNull(
      await AuditLog.query().where('action', 'social.pinterest_retry_requested').first()
    )

    const revoked = await client
      .delete(`/api/v1/social/pinterest/accounts/${pinterest.id}`)
      .loginAs(agency)
      .withCsrfToken()
    revoked.assertStatus(200)
    await pinterest.refresh()
    assert.equal(pinterest.status, 'revoked')
    assert.isNull(pinterest.encryptedAccessToken)
  })

  test('keeps the publication scheduled while another network is still active', async ({
    assert,
  }) => {
    const agency = await user('agency', 'aggregate')
    const customer = await user('client', 'aggregate')
    const parent = await project(agency, customer)
    const publication = await approvedPublication(agency, parent)
    const pinterest = await account(agency)
    const facebook = await SocialAccount.create({
      agencyId,
      network: 'facebook',
      externalAccountId: '1234567890',
      externalAccountName: 'Page test',
      encryptedAccessToken: encryptSocialToken('page-token', tokenKey),
      encryptedRefreshToken: null,
      expiresAt: DateTime.utc().plus({ days: 30 }),
      scopes: ['pages_manage_posts'],
      metadataJson: {},
      status: 'connected',
      createdBy: agency.id,
      revokedAt: null,
    })
    const pinterestSchedule = await ScheduledPublication.create({
      publicationId: publication.id,
      network: 'pinterest',
      accountId: pinterest.id,
      publicationVersion: 2,
      runAt: DateTime.utc(),
      status: 'queued',
      idempotencyKey: 'b'.repeat(64),
      payloadHash: 'c'.repeat(64),
    })
    const facebookSchedule = await ScheduledPublication.create({
      publicationId: publication.id,
      network: 'facebook',
      accountId: facebook.id,
      publicationVersion: 2,
      runAt: DateTime.utc(),
      status: 'queued',
      idempotencyKey: 'd'.repeat(64),
      payloadHash: 'e'.repeat(64),
    })
    publication.status = 'scheduled'
    await publication.save()

    await markSocialScheduleFailed(pinterestSchedule.id, publication.id)
    await publication.refresh()
    assert.equal(publication.status, 'scheduled')

    await markSocialScheduleFailed(facebookSchedule.id, publication.id)
    await publication.refresh()
    assert.equal(publication.status, 'failed')
  })

  test('returns safe errors for missing resources and invalid Pinterest operations', async ({
    client,
  }) => {
    const agency = await user('agency', 'errors')
    const customer = await user('client', 'errors')
    const parent = await project(agency, customer)
    const publication = await approvedPublication(agency, parent)
    const pinterest = await account(agency)
    const missingId = randomUUID()

    const accounts = await client.get('/api/v1/social/pinterest/accounts').loginAs(agency)
    accounts.assertStatus(200)

    const missingRefresh = await client
      .post(`/api/v1/social/pinterest/accounts/${missingId}/refresh`)
      .loginAs(agency)
      .withCsrfToken()
    missingRefresh.assertStatus(404)

    const unavailableRefresh = await client
      .post(`/api/v1/social/pinterest/accounts/${pinterest.id}/refresh`)
      .loginAs(agency)
      .withCsrfToken()
    unavailableRefresh.assertStatus(422)

    const missingRevoke = await client
      .delete(`/api/v1/social/pinterest/accounts/${missingId}`)
      .loginAs(agency)
      .withCsrfToken()
    missingRevoke.assertStatus(404)

    const emptyStatus = await client
      .get(`/api/v1/social/pinterest/publications/${publication.id}/status`)
      .loginAs(agency)
    emptyStatus.assertStatus(200)
    emptyStatus.assertBodyContains({ data: null })

    const missingPublicationStatus = await client
      .get(`/api/v1/social/pinterest/publications/${missingId}/status`)
      .loginAs(agency)
    missingPublicationStatus.assertStatus(404)

    const missingValidationPublication = await client
      .post(`/api/v1/social/pinterest/publications/${missingId}/validate`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: pinterest.id, ...pin })
    missingValidationPublication.assertStatus(404)

    const missingValidationAccount = await client
      .post(`/api/v1/social/pinterest/publications/${publication.id}/validate`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: missingId, ...pin })
    missingValidationAccount.assertStatus(404)

    const missingSchedulePublication = await client
      .post(`/api/v1/social/pinterest/publications/${missingId}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: pinterest.id, ...pin })
    missingSchedulePublication.assertStatus(404)

    const missingScheduleAccount = await client
      .post(`/api/v1/social/pinterest/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: missingId, ...pin })
    missingScheduleAccount.assertStatus(404)

    const invalidBoard = await client
      .post(`/api/v1/social/pinterest/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: pinterest.id, ...pin, boardId: 'unknown-board' })
    invalidBoard.assertStatus(422)

    const scheduled = await client
      .post(`/api/v1/social/pinterest/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: pinterest.id, ...pin, link: null })
    scheduled.assertStatus(201)

    const scheduleStatus = await client
      .get(`/api/v1/social/pinterest/schedules/${scheduled.body().data.id}`)
      .loginAs(customer)
    scheduleStatus.assertStatus(200)

    const missingScheduleStatus = await client
      .get(`/api/v1/social/pinterest/schedules/${missingId}`)
      .loginAs(agency)
    missingScheduleStatus.assertStatus(404)

    const missingRetry = await client
      .post(`/api/v1/social/pinterest/schedules/${missingId}/retry`)
      .loginAs(agency)
      .withCsrfToken()
    missingRetry.assertStatus(404)

    const queuedRetry = await client
      .post(`/api/v1/social/pinterest/schedules/${scheduled.body().data.id}/retry`)
      .loginAs(agency)
      .withCsrfToken()
    queuedRetry.assertStatus(409)
  })

  test('requires an admin to select an agency with an existing project for OAuth', async ({
    client,
  }) => {
    const admin = await User.create({
      displayName: 'Admin Pinterest',
      email: 'admin-oauth@pinterest.test',
      password,
      role: 'admin',
      agencyId: null,
      isActive: true,
    })
    const agency = await user('agency', 'admin-oauth')
    const customer = await user('client', 'admin-oauth')
    await project(agency, customer)

    const missingAgency = await client
      .post('/api/v1/social/pinterest/oauth/start')
      .loginAs(admin)
      .withCsrfToken()
      .json({})
    missingAgency.assertStatus(422)

    const unknownAgency = await client
      .post('/api/v1/social/pinterest/oauth/start')
      .loginAs(admin)
      .withCsrfToken()
      .json({ agencyId: randomUUID() })
    unknownAgency.assertStatus(422)

    const validAgency = await client
      .post('/api/v1/social/pinterest/oauth/start')
      .loginAs(admin)
      .withCsrfToken()
      .json({ agencyId })
    validAgency.assertStatus(200)
  })
})
