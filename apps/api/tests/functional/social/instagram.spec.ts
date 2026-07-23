import AuditLog from '#models/audit_log'
import MediaAsset from '#models/media_asset'
import Project from '#models/project'
import PublicationMedia from '#models/publication_media'
import ScheduledPublication from '#models/scheduled_publication'
import SocialAccount from '#models/social_account'
import Publication from '#models/publication'
import User from '#models/user'
import { encryptSocialToken } from '#services/social/token_cipher'
import { instagramPayloadHash } from '#domain/social/instagram'
import { markSocialScheduleFailed } from '#services/social/social_status_service'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { createHash, randomUUID } from 'node:crypto'

const agencyId = '80000000-0000-4000-8000-000000000001'
const password = 'correct-horse-battery-staple'
const tokenKey = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY='

async function user(role: 'agency' | 'client', suffix: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@instagram.test`,
    password,
    role,
    agencyId,
    isActive: true,
  })
}

async function project(owner: User, customer: User) {
  const item = await Project.create({
    agencyId,
    name: 'Projet Instagram',
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
    title: 'Publication Instagram approuvée',
    baseText: 'Bonjour Instagram',
    status: 'approved',
    targetNetworks: ['instagram'],
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
    originalName: 'instagram.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 4,
    checksum: createHash('sha256').update('jpeg').digest('hex'),
    width: 1080,
    height: 1080,
    durationMs: null,
    altText: 'Visuel Instagram',
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
    network: 'instagram',
    externalAccountId: '17841400000000000',
    externalAccountName: '@wepost_test',
    encryptedAccessToken: encryptSocialToken('page-token', tokenKey),
    encryptedRefreshToken: null,
    expiresAt: DateTime.utc().plus({ days: 30 }),
    scopes: [
      'pages_show_list',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_content_publish',
    ],
    metadataJson: { pageTasks: ['CREATE_CONTENT'], facebookPageId: '1234567890' },
    status: 'connected',
    createdBy: owner.id,
    revokedAt: null,
  })
}

test.group('Instagram publishing HTTP', () => {
  test('connects the explicitly selected managed Page with protected OAuth state', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'oauth')
    const customer = await user('client', 'oauth')
    await project(agency, customer)

    const start = await client
      .post('/api/v1/social/instagram/oauth/start')
      .loginAs(agency)
      .withCsrfToken()
      .json({ instagramAccountId: '17841400000000000' })
    start.assertStatus(200)
    const authorization = new URL(start.body().data.authorizationUrl)

    const callback = await client
      .get(`${authorization.pathname}${authorization.search}`)
      .withSession(start.session())
      .redirects(0)
    callback.assertStatus(302)
    const connected = await SocialAccount.query().where('agencyId', agencyId).firstOrFail()
    assert.equal(connected.externalAccountId, '17841400000000000')
    assert.notInclude(connected.encryptedAccessToken!, 'mock-instagram-access-token')
    assert.isNotNull(await AuditLog.query().where('action', 'social.instagram_connected').first())

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
    const instagram = await account(agency)

    const validation = await client
      .post(`/api/v1/social/instagram/publications/${publication.id}/validate`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: instagram.id })
    validation.assertStatus(200)
    validation.assertBodyContains({ data: { valid: true } })

    const scheduled = await client
      .post(`/api/v1/social/instagram/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: instagram.id, runAt: DateTime.utc().plus({ minutes: 5 }).toISO() })
    scheduled.assertStatus(201)
    scheduled.assertBodyContains({ data: { status: 'queued', publicationVersion: 2 } })

    const duplicate = await client
      .post(`/api/v1/social/instagram/publications/${publication.id}/schedule`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ accountId: instagram.id })
    duplicate.assertStatus(200)
    duplicate.assertBodyContains({ data: { id: scheduled.body().data.id } })

    const status = await client
      .get(`/api/v1/social/instagram/publications/${publication.id}/status`)
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
    const instagram = await account(agency)

    const denied = await client
      .post(`/api/v1/social/instagram/publications/${publication.id}/schedule`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ accountId: instagram.id })
    denied.assertStatus(403)

    const schedule = await ScheduledPublication.create({
      publicationId: publication.id,
      network: 'instagram',
      accountId: instagram.id,
      publicationVersion: 2,
      runAt: DateTime.utc(),
      status: 'failed',
      idempotencyKey: 'a'.repeat(64),
      payloadHash: instagramPayloadHash({ text: publication.baseText, media: [] }),
    })
    publication.status = 'failed'
    await publication.save()
    const retry = await client
      .post(`/api/v1/social/instagram/schedules/${schedule.id}/retry`)
      .loginAs(agency)
      .withCsrfToken()
    retry.assertStatus(202)
    assert.isNotNull(
      await AuditLog.query().where('action', 'social.instagram_retry_requested').first()
    )

    const revoked = await client
      .delete(`/api/v1/social/instagram/accounts/${instagram.id}`)
      .loginAs(agency)
      .withCsrfToken()
    revoked.assertStatus(200)
    await instagram.refresh()
    assert.equal(instagram.status, 'revoked')
    assert.isNull(instagram.encryptedAccessToken)
  })

  test('keeps the publication scheduled while another network is still active', async ({
    assert,
  }) => {
    const agency = await user('agency', 'aggregate')
    const customer = await user('client', 'aggregate')
    const parent = await project(agency, customer)
    const publication = await approvedPublication(agency, parent)
    const instagram = await account(agency)
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
    const instagramSchedule = await ScheduledPublication.create({
      publicationId: publication.id,
      network: 'instagram',
      accountId: instagram.id,
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

    await markSocialScheduleFailed(instagramSchedule.id, publication.id)
    await publication.refresh()
    assert.equal(publication.status, 'scheduled')

    await markSocialScheduleFailed(facebookSchedule.id, publication.id)
    await publication.refresh()
    assert.equal(publication.status, 'failed')
  })
})
