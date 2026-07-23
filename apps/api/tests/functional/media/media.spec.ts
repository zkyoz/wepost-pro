import MediaAsset from '#models/media_asset'
import Project from '#models/project'
import Publication from '#models/publication'
import PublicationMedia from '#models/publication_media'
import User from '#models/user'
import { cleanupAbandonedUploads } from '#services/media/media_service'
import {
  getLocalObject,
  putLocalObject,
  resetLocalMediaStorage,
} from '#services/media/media_storage'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { createHash, randomUUID } from 'node:crypto'

const agencyA = '30000000-0000-4000-8000-000000000001'
const agencyB = '30000000-0000-4000-8000-000000000002'
const password = 'correct-horse-battery-staple'
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64'
)

type InitializedMediaBody = {
  data: { id: string }
  upload: { url: string }
}

type ListedMediaBody = {
  data: Array<{ id: string; readUrl: string }>
}

async function user(role: 'agency' | 'client', suffix: string, agencyId: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@media.test`,
    password,
    role,
    agencyId,
    isActive: true,
  })
}

async function publication(owner: User, customer: User) {
  const project = await Project.create({
    agencyId: customer.agencyId!,
    name: 'Projet médias',
    description: '',
    status: 'active',
    clientUserId: customer.id,
    timezone: 'Europe/Paris',
    createdBy: owner.id,
    archivedAt: null,
  })
  await db.table('project_members').insert({
    project_id: project.id,
    user_id: customer.id,
    membership_role: 'primary',
    created_at: new Date(),
  })
  return Publication.create({
    agencyId: project.agencyId,
    projectId: project.id,
    title: 'Publication média',
    baseText: 'Texte',
    status: 'draft',
    targetNetworks: ['linkedin'],
    scheduledAt: null,
    timezone: 'Europe/Paris',
    contentVersion: 1,
    approvedVersion: null,
    createdBy: owner.id,
    updatedBy: owner.id,
    archivedAt: null,
  })
}

function uploadPayload(bytes = png, overrides: Record<string, unknown> = {}) {
  return {
    originalName: 'visuel-client.png',
    declaredMimeType: 'image/png',
    sizeBytes: bytes.length,
    checksum: createHash('sha256').update(bytes).digest('hex'),
    altText: 'Une campagne présentée sur fond bleu',
    isDecorative: false,
    ...overrides,
  }
}

test.group('Publication media', (group) => {
  group.each.setup(() => resetLocalMediaStorage())

  test('runs signed upload, validation, association, metadata, order and soft deletion', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'cycle', agencyA)
    const customer = await user('client', 'cycle', agencyA)
    const post = await publication(agency, customer)

    const initialized = await client
      .post(`/api/v1/publications/${post.id}/media/uploads`)
      .loginAs(agency)
      .withCsrfToken()
      .json(uploadPayload())
    initialized.assertStatus(201)
    const initializedBody = initialized.body() as InitializedMediaBody
    const mediaId = initializedBody.data.id
    const uploadUrl = new URL(initializedBody.upload.url)
    const upload = await client
      .put(`${uploadUrl.pathname}${uploadUrl.search}`)
      .type('image/png')
      .setup((apiRequest) => apiRequest.request.send(png))
    upload.assertStatus(204)

    const finalized = await client
      .post(`/api/v1/media/${mediaId}/finalize`)
      .loginAs(agency)
      .withCsrfToken()
    finalized.assertStatus(200)
    finalized.assertBodyContains({
      data: { scanStatus: 'clean', mimeType: 'image/png', width: 1, height: 1 },
    })

    const attached = await client
      .post(`/api/v1/publications/${post.id}/media`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ mediaId })
    attached.assertStatus(201)

    const secondBytes = Buffer.concat([png, Buffer.from([0])])
    const second = await MediaAsset.create({
      agencyId: agencyA,
      uploaderId: agency.id,
      storageKey: `test/${randomUUID()}.png`,
      originalName: 'second.png',
      mimeType: 'image/png',
      sizeBytes: secondBytes.length,
      checksum: createHash('sha256').update(secondBytes).digest('hex'),
      width: 1,
      height: 1,
      durationMs: null,
      altText: 'Second visuel',
      isDecorative: false,
      scanStatus: 'clean',
      uploadExpiresAt: DateTime.utc().plus({ hours: 1 }),
      deletedAt: null,
    })
    putLocalObject(second.storageKey, { bytes: secondBytes, contentType: 'image/png' })
    await PublicationMedia.create({ publicationId: post.id, mediaId: second.id, position: 1 })

    const reordered = await client
      .patch(`/api/v1/publications/${post.id}/media/order`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ mediaIds: [second.id, mediaId] })
    reordered.assertStatus(200)

    const updated = await client
      .patch(`/api/v1/media/${mediaId}`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ altText: null, isDecorative: true })
    updated.assertStatus(200)
    updated.assertBodyContains({ data: { altText: null, isDecorative: true } })

    const listed = await client.get(`/api/v1/publications/${post.id}/media`).loginAs(customer)
    listed.assertStatus(200)
    const listedBody = listed.body() as ListedMediaBody
    assert.deepEqual(
      listedBody.data.map((media) => media.id),
      [second.id, mediaId]
    )
    assert.match(listedBody.data[0]!.readUrl, /media\/local-read\?token=/)

    const removed = await client.delete(`/api/v1/media/${mediaId}`).loginAs(agency).withCsrfToken()
    removed.assertStatus(200)
    const removedMedia = await MediaAsset.findOrFail(mediaId)
    assert.isNotNull(removedMedia.deletedAt)
    assert.isNull(await PublicationMedia.query().where('mediaId', mediaId).first())

    const purge = await client
      .post(`/api/v1/media/${mediaId}/purge`)
      .loginAs(agency)
      .withCsrfToken()
    purge.assertStatus(204)
    assert.isNull(await MediaAsset.find(mediaId))
  })

  test('rejects MIME spoofing, excessive size and missing image alternative', async ({
    client,
  }) => {
    const agency = await user('agency', 'security', agencyA)
    const customer = await user('client', 'security', agencyA)
    const post = await publication(agency, customer)

    const missingAlt = await client
      .post(`/api/v1/publications/${post.id}/media/uploads`)
      .loginAs(agency)
      .withCsrfToken()
      .json(uploadPayload(png, { altText: '', isDecorative: false }))
    missingAlt.assertStatus(422)

    const oversized = await client
      .post(`/api/v1/publications/${post.id}/media/uploads`)
      .loginAs(agency)
      .withCsrfToken()
      .json(uploadPayload(png, { sizeBytes: 30 * 1024 * 1024 }))
    oversized.assertStatus(413)

    const initialized = await client
      .post(`/api/v1/publications/${post.id}/media/uploads`)
      .loginAs(agency)
      .withCsrfToken()
      .json(uploadPayload(png, { declaredMimeType: 'image/jpeg' }))
    initialized.assertStatus(201)
    const initializedBody = initialized.body() as InitializedMediaBody
    const spoofedMedia = await MediaAsset.findOrFail(initializedBody.data.id)
    putLocalObject(spoofedMedia.storageKey, {
      bytes: png,
      contentType: 'image/jpeg',
    })
    const rejected = await client
      .post(`/api/v1/media/${initializedBody.data.id}/finalize`)
      .loginAs(agency)
      .withCsrfToken()
    rejected.assertStatus(422)
    rejected.assertBodyContains({ errors: [{ field: 'file' }] })
  })

  test('enforces client and inter-agency isolation', async ({ client }) => {
    const agency = await user('agency', 'scope', agencyA)
    const customer = await user('client', 'scope', agencyA)
    const foreignAgency = await user('agency', 'scope-foreign', agencyB)
    const post = await publication(agency, customer)
    const media = await MediaAsset.create({
      agencyId: agencyA,
      uploaderId: agency.id,
      storageKey: `test/${randomUUID()}.png`,
      originalName: 'scope.png',
      mimeType: 'image/png',
      sizeBytes: png.length,
      checksum: createHash('sha256').update(png).digest('hex'),
      width: 1,
      height: 1,
      durationMs: null,
      altText: 'Visuel autorisé',
      isDecorative: false,
      scanStatus: 'clean',
      uploadExpiresAt: DateTime.utc(),
      deletedAt: null,
    })
    putLocalObject(media.storageKey, { bytes: png, contentType: 'image/png' })
    await PublicationMedia.create({ publicationId: post.id, mediaId: media.id, position: 0 })

    const clientRead = await client.get(`/api/v1/media/${media.id}/read-url`).loginAs(customer)
    clientRead.assertStatus(200)
    const clientWrite = await client
      .patch(`/api/v1/media/${media.id}`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ altText: 'Intrusion', isDecorative: false })
    clientWrite.assertStatus(403)
    const foreignRead = await client
      .get(`/api/v1/media/${media.id}/read-url`)
      .loginAs(foreignAgency)
    foreignRead.assertStatus(404)
  })

  test('cleans abandoned pending uploads and their object', async ({ assert }) => {
    const agency = await user('agency', 'cleanup', agencyA)
    const media = await MediaAsset.create({
      agencyId: agencyA,
      uploaderId: agency.id,
      storageKey: `test/${randomUUID()}.png`,
      originalName: 'abandoned.png',
      mimeType: 'image/png',
      sizeBytes: png.length,
      checksum: createHash('sha256').update(png).digest('hex'),
      width: null,
      height: null,
      durationMs: null,
      altText: 'Upload abandonné',
      isDecorative: false,
      scanStatus: 'pending_upload',
      uploadExpiresAt: DateTime.utc().minus({ hours: 2 }),
      deletedAt: null,
    })
    putLocalObject(media.storageKey, { bytes: png, contentType: 'image/png' })
    assert.equal(await cleanupAbandonedUploads({ before: DateTime.utc(), agencyId: agencyA }), 1)
    assert.isNull(await MediaAsset.find(media.id))
    assert.isUndefined(getLocalObject(media.storageKey))
  })
})
