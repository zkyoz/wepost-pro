import AuditLog from '#models/audit_log'
import MediaAsset from '#models/media_asset'
import Project from '#models/project'
import PublicationMedia from '#models/publication_media'
import ScheduledPublication from '#models/scheduled_publication'
import SocialAccount from '#models/social_account'
import Publication from '#models/publication'
import User from '#models/user'
import { encryptSocialToken } from '#services/social/token_cipher'
import { tiktokPayloadHash } from '#domain/social/tiktok'
import { markSocialScheduleFailed } from '#services/social/social_status_service'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { createHash, randomUUID } from 'node:crypto'

const agencyId = '80000000-0000-4000-8000-000000000001'
const password = 'correct-horse-battery-staple'
const tokenKey = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY='
const video = {
  privacyLevel: 'SELF_ONLY' as const,
  caption: 'Bonjour TikTok',
  disableComment: false,
  disableDuet: false,
  disableStitch: false,
  brandContentToggle: false,
  brandOrganicToggle: true,
  isAigc: false,
}

async function user(role: 'agency' | 'client', suffix: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@tiktok.test`,
    password,
    role,
    agencyId,
    isActive: true,
  })
}

async function project(owner: User, customer: User) {
  const item = await Project.create({
    agencyId,
    name: 'Projet TikTok',
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
    title: 'Publication TikTok approuvée',
    baseText: 'Bonjour TikTok',
    status: 'approved',
    targetNetworks: ['tiktok'],
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
    storageKey: `test/${randomUUID()}.mp4`,
    originalName: 'tiktok.mp4',
    mimeType: 'video/mp4',
    sizeBytes: 4,
    checksum: createHash('sha256').update('jpeg').digest('hex'),
    width: 1080,
    height: 1920,
    durationMs: 30_000,
    altText: null,
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
    network: 'tiktok',
    externalAccountId: '987654321',
    externalAccountName: 'wepost_test',
    encryptedAccessToken: encryptSocialToken('page-token', tokenKey),
    encryptedRefreshToken: null,
    expiresAt: DateTime.utc().plus({ days: 30 }),
    scopes: ['user.info.basic', 'video.publish'],
    metadataJson: {
      creatorInfo: {
        privacyLevelOptions: ['SELF_ONLY'],
        commentDisabled: false,
        duetDisabled: false,
        stitchDisabled: false,
        maxVideoPostDurationSec: 180,
      },
    },
    status: 'connected',
    createdBy: owner.id,
    revokedAt: null,
  })
}

test.group('TikTok publishing HTTP', () => {
  test('connects the TikTok account and loads creator capabilities with protected OAuth state', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'oauth')
    const customer = await user('client', 'oauth')
    await project(agency, customer)

    const start = await client
      .post('/api/v1/social/tiktok/oauth/start')
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
    assert.equal(connected.externalAccountId, 'tiktok-open-id')
    assert.equal(
      (connected.metadataJson.creatorInfo as { maxVideoPostDurationSec: number })
        .maxVideoPostDurationSec,
      180
    )
    assert.notInclude(connected.encryptedAccessToken!, 'mock-tiktok-access-token')
    assert.isNotNull(await AuditLog.query().where('action', 'social.tiktok_connected').first())

    const refreshed = await client
      .post(`/api/v1/social/tiktok/accounts/${connected.id}/refresh`)
      .loginAs(agency)
      .withCsrfToken()
    refreshed.assertStatus(200)
    assert.isNotNull(await AuditLog.query().where('action', 'social.tiktok_refreshed').first())

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
    const tiktok = await account(agency)

    const validation = await client
      .post(`/api/v1/social/tiktok/publications/${publication.id}/validate`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: tiktok.id, ...video })
    validation.assertStatus(200)
    validation.assertBodyContains({ data: { valid: true } })

    const scheduled = await client
      .post(`/api/v1/social/tiktok/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: tiktok.id, ...video, runAt: DateTime.utc().plus({ minutes: 5 }).toISO() })
    scheduled.assertStatus(201)
    scheduled.assertBodyContains({ data: { status: 'queued', publicationVersion: 2 } })

    const duplicate = await client
      .post(`/api/v1/social/tiktok/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: tiktok.id, ...video })
    duplicate.assertStatus(200)
    duplicate.assertBodyContains({ data: { id: scheduled.body().data.id } })

    const status = await client
      .get(`/api/v1/social/tiktok/publications/${publication.id}/status`)
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
    const tiktok = await account(agency)

    const denied = await client
      .post(`/api/v1/social/tiktok/publications/${publication.id}/schedule`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ accountId: tiktok.id, ...video })
    denied.assertStatus(403)

    const schedule = await ScheduledPublication.create({
      publicationId: publication.id,
      network: 'tiktok',
      accountId: tiktok.id,
      publicationVersion: 2,
      runAt: DateTime.utc(),
      status: 'failed',
      idempotencyKey: 'a'.repeat(64),
      networkPayloadJson: video,
      payloadHash: tiktokPayloadHash({ video, media: [] }),
      providerJobId: 'failed-provider-id',
      providerStatus: 'FAILED',
    })
    publication.status = 'failed'
    await publication.save()
    const retry = await client
      .post(`/api/v1/social/tiktok/schedules/${schedule.id}/retry`)
      .loginAs(agency)
      .withCsrfToken()
    retry.assertStatus(202)
    await schedule.refresh()
    assert.isNull(schedule.providerJobId)
    assert.isNotNull(
      await AuditLog.query().where('action', 'social.tiktok_retry_requested').first()
    )

    const revoked = await client
      .delete(`/api/v1/social/tiktok/accounts/${tiktok.id}`)
      .loginAs(agency)
      .withCsrfToken()
    revoked.assertStatus(200)
    await tiktok.refresh()
    assert.equal(tiktok.status, 'revoked')
    assert.isNull(tiktok.encryptedAccessToken)
  })

  test('keeps the publication scheduled while another network is still active', async ({
    assert,
  }) => {
    const agency = await user('agency', 'aggregate')
    const customer = await user('client', 'aggregate')
    const parent = await project(agency, customer)
    const publication = await approvedPublication(agency, parent)
    const tiktok = await account(agency)
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
    const tiktokSchedule = await ScheduledPublication.create({
      publicationId: publication.id,
      network: 'tiktok',
      accountId: tiktok.id,
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

    await markSocialScheduleFailed(tiktokSchedule.id, publication.id)
    await publication.refresh()
    assert.equal(publication.status, 'scheduled')

    await markSocialScheduleFailed(facebookSchedule.id, publication.id)
    await publication.refresh()
    assert.equal(publication.status, 'failed')
  })

  test('returns safe errors for missing resources and invalid TikTok operations', async ({
    client,
  }) => {
    const agency = await user('agency', 'errors')
    const customer = await user('client', 'errors')
    const parent = await project(agency, customer)
    const publication = await approvedPublication(agency, parent)
    const tiktok = await account(agency)
    const missingId = randomUUID()

    const accounts = await client.get('/api/v1/social/tiktok/accounts').loginAs(agency)
    accounts.assertStatus(200)

    const missingRefresh = await client
      .post(`/api/v1/social/tiktok/accounts/${missingId}/refresh`)
      .loginAs(agency)
      .withCsrfToken()
    missingRefresh.assertStatus(404)

    const unavailableRefresh = await client
      .post(`/api/v1/social/tiktok/accounts/${tiktok.id}/refresh`)
      .loginAs(agency)
      .withCsrfToken()
    unavailableRefresh.assertStatus(422)

    const missingRevoke = await client
      .delete(`/api/v1/social/tiktok/accounts/${missingId}`)
      .loginAs(agency)
      .withCsrfToken()
    missingRevoke.assertStatus(404)

    const emptyStatus = await client
      .get(`/api/v1/social/tiktok/publications/${publication.id}/status`)
      .loginAs(agency)
    emptyStatus.assertStatus(200)
    emptyStatus.assertBodyContains({ data: null })

    const missingPublicationStatus = await client
      .get(`/api/v1/social/tiktok/publications/${missingId}/status`)
      .loginAs(agency)
    missingPublicationStatus.assertStatus(404)

    const missingValidationPublication = await client
      .post(`/api/v1/social/tiktok/publications/${missingId}/validate`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: tiktok.id, ...video })
    missingValidationPublication.assertStatus(404)

    const missingValidationAccount = await client
      .post(`/api/v1/social/tiktok/publications/${publication.id}/validate`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: missingId, ...video })
    missingValidationAccount.assertStatus(404)

    const missingSchedulePublication = await client
      .post(`/api/v1/social/tiktok/publications/${missingId}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: tiktok.id, ...video })
    missingSchedulePublication.assertStatus(404)

    const missingScheduleAccount = await client
      .post(`/api/v1/social/tiktok/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: missingId, ...video })
    missingScheduleAccount.assertStatus(404)

    const invalidPrivacy = await client
      .post(`/api/v1/social/tiktok/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: tiktok.id, ...video, privacyLevel: 'FOLLOWER_OF_CREATOR' })
    invalidPrivacy.assertStatus(422)

    const scheduled = await client
      .post(`/api/v1/social/tiktok/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: tiktok.id, ...video })
    scheduled.assertStatus(201)

    const scheduleStatus = await client
      .get(`/api/v1/social/tiktok/schedules/${scheduled.body().data.id}`)
      .loginAs(customer)
    scheduleStatus.assertStatus(200)

    const missingScheduleStatus = await client
      .get(`/api/v1/social/tiktok/schedules/${missingId}`)
      .loginAs(agency)
    missingScheduleStatus.assertStatus(404)

    const missingRetry = await client
      .post(`/api/v1/social/tiktok/schedules/${missingId}/retry`)
      .loginAs(agency)
      .withCsrfToken()
    missingRetry.assertStatus(404)

    const queuedRetry = await client
      .post(`/api/v1/social/tiktok/schedules/${scheduled.body().data.id}/retry`)
      .loginAs(agency)
      .withCsrfToken()
    queuedRetry.assertStatus(409)
  })

  test('requires an admin to select an agency with an existing project for OAuth', async ({
    client,
  }) => {
    const admin = await User.create({
      displayName: 'Admin TikTok',
      email: 'admin-oauth@tiktok.test',
      password,
      role: 'admin',
      agencyId: null,
      isActive: true,
    })
    const agency = await user('agency', 'admin-oauth')
    const customer = await user('client', 'admin-oauth')
    await project(agency, customer)

    const missingAgency = await client
      .post('/api/v1/social/tiktok/oauth/start')
      .loginAs(admin)
      .withCsrfToken()
      .json({})
    missingAgency.assertStatus(422)

    const unknownAgency = await client
      .post('/api/v1/social/tiktok/oauth/start')
      .loginAs(admin)
      .withCsrfToken()
      .json({ agencyId: randomUUID() })
    unknownAgency.assertStatus(422)

    const validAgency = await client
      .post('/api/v1/social/tiktok/oauth/start')
      .loginAs(admin)
      .withCsrfToken()
      .json({ agencyId })
    validAgency.assertStatus(200)
  })
})
