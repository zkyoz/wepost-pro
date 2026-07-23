import Annotation from '#models/annotation'
import AuditLog from '#models/audit_log'
import Comment from '#models/comment'
import MediaAsset from '#models/media_asset'
import Project from '#models/project'
import Publication from '#models/publication'
import PublicationMedia from '#models/publication_media'
import User from '#models/user'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'

const agencyA = '98000000-0000-4000-8000-000000000001'
const agencyB = '98000000-0000-4000-8000-000000000002'
const password = 'correct-horse-battery-staple'

async function user(role: 'admin' | 'agency' | 'client', suffix: string, agencyId: string | null) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@annotations.test`,
    password,
    role,
    agencyId,
    isActive: true,
  })
}

async function setupPublication(owner: User, customer: User) {
  const project = await Project.create({
    agencyId: customer.agencyId!,
    name: 'Projet annotations',
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
  const publication = await Publication.create({
    agencyId: project.agencyId,
    projectId: project.id,
    title: 'Publication annotée',
    baseText: 'Contenu',
    status: 'awaiting_client_review',
    targetNetworks: ['instagram'],
    scheduledAt: null,
    timezone: project.timezone,
    contentVersion: 1,
    approvedVersion: null,
    createdBy: owner.id,
    updatedBy: owner.id,
    archivedAt: null,
  })
  const media = await MediaAsset.create({
    agencyId: project.agencyId,
    uploaderId: owner.id,
    storageKey: `annotations/${randomUUID()}.png`,
    originalName: 'maquette.png',
    mimeType: 'image/png',
    sizeBytes: 128,
    checksum: 'a'.repeat(64),
    width: 1200,
    height: 630,
    durationMs: null,
    altText: 'Maquette de publication',
    isDecorative: false,
    scanStatus: 'clean',
    uploadExpiresAt: DateTime.utc().plus({ hours: 1 }),
    deletedAt: null,
  })
  await PublicationMedia.create({ publicationId: publication.id, mediaId: media.id, position: 0 })
  return { project, publication, media }
}

const point = { shape: 'point', x: 0.25, y: 0.4, width: null, height: null }

test.group('Media annotations HTTP', () => {
  test('creates, lists, links, edits and soft-deletes an accessible annotation', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'cycle', agencyA)
    const customer = await user('client', 'cycle', agencyA)
    const { publication, media } = await setupPublication(agency, customer)
    const comment = await Comment.create({
      publicationId: publication.id,
      authorId: customer.id,
      body: 'Le visuel comporte une zone à revoir.',
      editedAt: null,
      deletedAt: null,
    })
    const rawText = '<img src=x onerror=alert(1)> Décaler le logo.'
    const created = await client
      .post(`/api/v1/publications/${publication.id}/media/${media.id}/annotations`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ ...point, body: rawText, commentId: comment.id })
    created.assertStatus(201)
    created.assertBodyContains({
      data: {
        body: rawText,
        publicationVersion: 1,
        mediaVersion: media.checksum,
        commentId: comment.id,
        historical: false,
        canEdit: true,
      },
    })

    const annotationId = (created.body().data as { id: string }).id
    const listed = await client
      .get(`/api/v1/publications/${publication.id}/media/${media.id}/annotations`)
      .loginAs(agency)
    listed.assertStatus(200)
    listed.assertBodyContains({ meta: { openCount: 1, currentPublicationVersion: 1 } })
    assert.deepEqual(
      (listed.body().data as { id: string }[]).map((item) => item.id),
      [annotationId]
    )

    const discussion = await client
      .get(`/api/v1/publications/${publication.id}/discussion`)
      .loginAs(customer)
    discussion.assertStatus(200)
    assert.deepEqual(discussion.body().data.comments[0].annotationIds, [annotationId])

    const updated = await client
      .patch(`/api/v1/annotations/${annotationId}`)
      .loginAs(customer)
      .withCsrfToken()
      .json({
        shape: 'rectangle',
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.25,
        body: 'Décaler le logo vers la gauche.',
      })
    updated.assertStatus(200)
    updated.assertBodyContains({ data: { shape: 'rectangle', width: 0.3 } })

    const removed = await client
      .delete(`/api/v1/annotations/${annotationId}`)
      .loginAs(customer)
      .withCsrfToken()
    removed.assertStatus(204)
    const removedAnnotation = await Annotation.findOrFail(annotationId)
    assert.isNotNull(removedAnnotation.deletedAt)
    assert.isNotNull(
      await AuditLog.query()
        .where('action', 'annotation.deleted')
        .where('entityId', annotationId)
        .first()
    )
  })

  test('enforces geometry, ownership, IDOR protection and admin moderation', async ({
    client,
    assert,
  }) => {
    const admin = await user('admin', 'security', null)
    const agency = await user('agency', 'security', agencyA)
    const customer = await user('client', 'security', agencyA)
    const otherCustomer = await user('client', 'security-other', agencyA)
    const foreignAgency = await user('agency', 'security-foreign', agencyB)
    const { publication, media } = await setupPublication(agency, customer)

    const invalid = await client
      .post(`/api/v1/publications/${publication.id}/media/${media.id}/annotations`)
      .loginAs(customer)
      .withCsrfToken()
      .json({
        shape: 'rectangle',
        x: 0.9,
        y: 0.9,
        width: 0.2,
        height: 0.2,
        body: 'Hors zone',
      })
    invalid.assertStatus(422)

    const empty = await client
      .post(`/api/v1/publications/${publication.id}/media/${media.id}/annotations`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ ...point, body: '   ' })
    empty.assertStatus(422)

    const otherRead = await client
      .get(`/api/v1/publications/${publication.id}/media/${media.id}/annotations`)
      .loginAs(otherCustomer)
    otherRead.assertStatus(404)
    const foreignCreate = await client
      .post(`/api/v1/publications/${publication.id}/media/${media.id}/annotations`)
      .loginAs(foreignAgency)
      .withCsrfToken()
      .json({ ...point, body: 'Interdit' })
    foreignCreate.assertStatus(404)

    const created = await client
      .post(`/api/v1/publications/${publication.id}/media/${media.id}/annotations`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ ...point, body: 'Annotation du client' })
    created.assertStatus(201)
    const annotationId = (created.body().data as { id: string }).id

    const agencyEdit = await client
      .patch(`/api/v1/annotations/${annotationId}`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ ...point, body: 'Modification par agence' })
    agencyEdit.assertStatus(403)

    const moderated = await client
      .delete(`/api/v1/annotations/${annotationId}`)
      .loginAs(admin)
      .withCsrfToken()
    moderated.assertStatus(204)
    assert.isNotNull(
      await AuditLog.query()
        .where('action', 'annotation.moderated')
        .where('entityId', annotationId)
        .first()
    )
  })

  test('keeps previous publication and media versions as textual history', async ({ client }) => {
    const agency = await user('agency', 'history', agencyA)
    const customer = await user('client', 'history', agencyA)
    const { publication, media } = await setupPublication(agency, customer)
    const created = await client
      .post(`/api/v1/publications/${publication.id}/media/${media.id}/annotations`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ ...point, body: 'Historique version 1' })
    created.assertStatus(201)

    publication.contentVersion = 2
    await publication.save()
    const history = await client
      .get(`/api/v1/publications/${publication.id}/media/${media.id}/annotations`)
      .loginAs(customer)
    history.assertStatus(200)
    history.assertBodyContains({
      data: [{ publicationVersion: 1, historical: true }],
      meta: { currentPublicationVersion: 2, openCount: 0 },
    })

    await PublicationMedia.query()
      .where('publicationId', publication.id)
      .where('mediaId', media.id)
      .delete()
    const detachedHistory = await client
      .get(`/api/v1/publications/${publication.id}/media/${media.id}/annotations?version=1`)
      .loginAs(customer)
    detachedHistory.assertStatus(200)
    detachedHistory.assertBodyContains({ meta: { mediaCurrentlyAttached: false, openCount: 0 } })
  })
})
