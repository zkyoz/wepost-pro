import AuditLog from '#models/audit_log'
import Comment from '#models/comment'
import MediaAsset from '#models/media_asset'
import Project from '#models/project'
import Publication from '#models/publication'
import PublicationReview from '#models/publication_review'
import ScheduledPublication from '#models/scheduled_publication'
import SocialAccount from '#models/social_account'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'

const agencyA = '00000000-0000-4000-8000-000000000016'
const agencyB = '00000000-0000-4000-8000-000000000017'

async function user(role: 'agency' | 'client', suffix: string, agencyId = agencyA) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@statistics.test`,
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
    description: 'Projet statistiques',
    status: 'active',
    clientUserId: client.id,
    timezone: 'Europe/Paris',
    createdBy: owner.id,
  })
}

async function publication(
  owner: User,
  projectId: string,
  title: string,
  status: Publication['status']
) {
  return Publication.create({
    agencyId: owner.agencyId!,
    projectId,
    title,
    baseText: 'Texte',
    status,
    targetNetworks: ['facebook', 'linkedin'],
    scheduledAt: DateTime.utc(),
    timezone: 'Europe/Paris',
    contentVersion: 1,
    approvedVersion: status === 'approved' ? 1 : null,
    createdBy: owner.id,
    updatedBy: owner.id,
    archivedAt: null,
  })
}

function currentPeriod() {
  return {
    from: DateTime.utc().minus({ days: 1 }).toISODate()!,
    to: DateTime.utc().plus({ days: 1 }).toISODate()!,
  }
}

test.group('Agency statistics HTTP', () => {
  test('aggregates real scoped metrics and exports formula-safe CSV', async ({
    client,
    assert,
  }) => {
    const owner = await user('agency', 'metrics')
    const customer = await user('client', 'metrics')
    const outsideOwner = await user('agency', 'outside', agencyB)
    const outsideCustomer = await user('client', 'outside', agencyB)
    const ownedProject = await project(owner, customer, '=HYPERLINK("https://evil.test")')
    const outsideProject = await project(outsideOwner, outsideCustomer, 'Invisible')
    const approved = await publication(owner, ownedProject.id, 'Approuvée', 'approved')
    const corrected = await publication(owner, ownedProject.id, 'À corriger', 'changes_requested')
    await publication(outsideOwner, outsideProject.id, 'Hors périmètre', 'failed')

    await AuditLog.create({
      actorUserId: owner.id,
      targetProjectId: ownedProject.id,
      targetPublicationId: approved.id,
      action: 'publication.status_changed',
      previousValues: { status: 'in_progress' },
      nextValues: { status: 'awaiting_client_review' },
    })
    await PublicationReview.create({
      publicationId: approved.id,
      reviewerId: customer.id,
      version: 1,
      decision: 'approved',
      message: null,
    })
    await PublicationReview.create({
      publicationId: corrected.id,
      reviewerId: customer.id,
      version: 1,
      decision: 'changes_requested',
      message: 'À revoir',
    })
    await Comment.create({
      publicationId: approved.id,
      authorId: customer.id,
      body: 'Commentaire utile',
      editedAt: null,
      deletedAt: null,
    })
    await MediaAsset.create({
      agencyId: agencyA,
      uploaderId: owner.id,
      storageKey: `statistics/${randomUUID()}`,
      originalName: 'image.png',
      mimeType: 'image/png',
      sizeBytes: 2048,
      checksum: 'a'.repeat(64),
      width: 1200,
      height: 630,
      durationMs: null,
      altText: 'Illustration',
      isDecorative: false,
      scanStatus: 'clean',
      uploadExpiresAt: DateTime.utc().plus({ hours: 1 }),
      deletedAt: null,
    })
    const account = await SocialAccount.create({
      agencyId: agencyA,
      network: 'facebook',
      externalAccountId: `page-${randomUUID()}`,
      externalAccountName: 'Page statistiques',
      encryptedAccessToken: null,
      encryptedRefreshToken: null,
      expiresAt: null,
      scopes: [],
      metadataJson: {},
      status: 'connected',
      createdBy: owner.id,
      revokedAt: null,
    })
    for (const status of ['published', 'failed'] as const) {
      await ScheduledPublication.create({
        publicationId: approved.id,
        network: 'facebook',
        accountId: account.id,
        publicationVersion: 1,
        runAt: DateTime.utc(),
        status,
        idempotencyKey: randomUUID().replaceAll('-', ''),
        payloadHash: 'b'.repeat(64),
        networkPayloadJson: {},
        providerJobId: null,
        providerStatus: null,
      })
    }

    const response = await client.get('/api/v1/statistics').qs(currentPeriod()).loginAs(owner)
    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        totals: {
          publications: 2,
          successRate: 50,
          comments: 1,
          corrections: 1,
          mediaCount: 1,
          mediaBytes: 2048,
        },
        remote: { available: false, label: 'N/A', lastSyncedAt: null },
      },
    })
    assert.isNumber(response.body().data.totals.meanApprovalHours)
    assert.deepEqual(response.body().data.byNetwork, [
      { key: 'facebook', count: 2 },
      { key: 'linkedin', count: 2 },
    ])
    assert.notInclude(JSON.stringify(response.body()), 'Hors périmètre')

    const csv = await client.get('/api/v1/statistics/export.csv').qs(currentPeriod()).loginAs(owner)
    csv.assertStatus(200)
    assert.include(csv.header('content-type')!, 'text/csv')
    assert.include(csv.text(), "'=HYPERLINK")
    assert.notInclude(csv.text(), '"=HYPERLINK')
  })

  test('denies clients and validates periods and project scope', async ({ client, assert }) => {
    const owner = await user('agency', 'secure')
    const customer = await user('client', 'secure')
    const outsideOwner = await user('agency', 'secure-outside', agencyB)
    const outsideCustomer = await user('client', 'secure-outside', agencyB)
    const outsideProject = await project(outsideOwner, outsideCustomer, 'Projet hors agence')
    await publication(outsideOwner, outsideProject.id, 'Invisible', 'published')

    await client
      .get('/api/v1/statistics')
      .qs(currentPeriod())
      .loginAs(customer)
      .then((response) => response.assertStatus(403))
    await client
      .get('/api/v1/statistics')
      .qs({ from: '2026-12-31', to: '2026-01-01' })
      .loginAs(owner)
      .then((response) => response.assertStatus(422))
    const scoped = await client
      .get('/api/v1/statistics')
      .qs({ ...currentPeriod(), projectId: outsideProject.id })
      .loginAs(owner)
    scoped.assertStatus(200)
    assert.equal(scoped.body().data.totals.publications, 0)
  })

  test('answers below the CRUD target on 20 clients and 800 publications', async ({
    client,
    assert,
  }) => {
    const owner = await user('agency', 'volume')
    const customer = await user('client', 'volume')
    const now = DateTime.utc().toSQL()!
    const projects = Array.from({ length: 20 }, (_, index) => ({
      id: randomUUID(),
      agency_id: agencyA,
      name: `Stats ${index}`,
      description: '',
      status: 'active',
      client_user_id: customer.id,
      timezone: 'Europe/Paris',
      created_by: owner.id,
      created_at: now,
      updated_at: now,
      archived_at: null,
    }))
    await db.table('projects').insert(projects)
    await db.table('publications').insert(
      projects.flatMap((projectRow, projectIndex) =>
        Array.from({ length: 40 }, (_, index) => ({
          id: randomUUID(),
          agency_id: agencyA,
          project_id: projectRow.id,
          title: `Stat ${projectIndex}-${index}`,
          base_text: '',
          status: index % 2 ? 'published' : 'draft',
          target_networks: ['facebook'],
          scheduled_at: null,
          timezone: 'Europe/Paris',
          content_version: 1,
          approved_version: null,
          created_by: owner.id,
          updated_by: owner.id,
          created_at: now,
          updated_at: now,
          archived_at: null,
        }))
      )
    )

    const response = await client.get('/api/v1/statistics').qs(currentPeriod()).loginAs(owner)
    response.assertStatus(200)
    assert.equal(response.body().data.totals.publications, 800)
    assert.isBelow(response.body().meta.durationMs, 500)
  })
})
