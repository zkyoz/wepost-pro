import AuditLog from '#models/audit_log'
import Comment from '#models/comment'
import Notification from '#models/notification'
import Project from '#models/project'
import Publication from '#models/publication'
import PublicationReview from '#models/publication_review'
import User from '#models/user'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

const agencyA = '70000000-0000-4000-8000-000000000001'
const agencyB = '70000000-0000-4000-8000-000000000002'
const password = 'correct-horse-battery-staple'

async function user(role: 'admin' | 'agency' | 'client', suffix: string, agencyId: string | null) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@collaboration.test`,
    password,
    role,
    agencyId,
    isActive: true,
  })
}

async function project(owner: User, customer: User, name = 'Projet collaboration') {
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

async function publication(owner: User, parent: Project, suffix = '') {
  return Publication.create({
    agencyId: parent.agencyId,
    projectId: parent.id,
    title: `Publication à valider ${suffix}`,
    baseText: 'Contenu à valider',
    status: 'awaiting_client_review',
    targetNetworks: ['linkedin'],
    scheduledAt: null,
    timezone: parent.timezone,
    contentVersion: 1,
    approvedVersion: null,
    createdBy: owner.id,
    updatedBy: owner.id,
    archivedAt: null,
  })
}

test.group('Comments, reviews and notifications HTTP', () => {
  test('creates a chronological plain-text thread and non-blocking notifications', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'thread', agencyA)
    const customer = await user('client', 'thread', agencyA)
    const parent = await project(agency, customer)
    const item = await publication(agency, parent)
    const xss = '<img src=x onerror=alert(1)> Bonjour'

    const created = await client
      .post(`/api/v1/publications/${item.id}/comments`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ body: xss })
    created.assertStatus(201)
    created.assertBodyContains({ data: { body: xss, author: { id: customer.id } } })

    const comment = await Comment.findOrFail(created.body().data.id)
    const notification = await Notification.query().where('userId', agency.id).firstOrFail()
    assert.equal(notification.emailStatus, 'pending')
    assert.match(notification.emailJobId!, /^memory-/)
    assert.notProperty(notification.payloadJson, 'body')

    const edited = await client
      .patch(`/api/v1/comments/${comment.id}`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ body: 'Commentaire corrigé' })
    edited.assertStatus(200)
    edited.assertBodyContains({ data: { body: 'Commentaire corrigé' } })

    const agencyComment = await client
      .post(`/api/v1/publications/${item.id}/comments`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ body: 'Bien reçu, nous préparons une nouvelle version.' })
    agencyComment.assertStatus(201)
    assert.isNotNull(
      await Notification.query().where('userId', customer.id).whereNull('readAt').first()
    )

    const thread = await client.get(`/api/v1/publications/${item.id}/discussion`).loginAs(agency)
    thread.assertStatus(200)
    assert.deepEqual(
      thread.body().data.comments.map((entry) => entry.body),
      ['Commentaire corrigé', 'Bien reçu, nous préparons une nouvelle version.']
    )
    assert.isNotNull(
      await AuditLog.query()
        .where('action', 'comment.created')
        .where('targetPublicationId', item.id)
        .first()
    )
  })

  test('records correction requests and approval against exact versions', async ({
    client,
    assert,
  }) => {
    const agency = await user('agency', 'review', agencyA)
    const customer = await user('client', 'review', agencyA)
    const parent = await project(agency, customer)
    const correctionsItem = await publication(agency, parent, 'corrections')

    const corrections = await client
      .post(`/api/v1/publications/${correctionsItem.id}/reviews`)
      .loginAs(customer)
      .withCsrfToken()
      .json({
        contentVersion: 1,
        decision: 'changes_requested',
        message: 'Clarifier la conclusion.',
      })
    corrections.assertStatus(201)
    corrections.assertBodyContains({
      data: { publication: { status: 'changes_requested', approvedVersion: null } },
    })

    const approvedItem = await publication(agency, parent, 'approbation')
    const stale = await client
      .post(`/api/v1/publications/${approvedItem.id}/reviews`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ contentVersion: 2, decision: 'approved' })
    stale.assertStatus(409)
    stale.assertBodyContains({ meta: { currentVersion: 1 } })

    const approved = await client
      .post(`/api/v1/publications/${approvedItem.id}/reviews`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ contentVersion: 1, decision: 'approved' })
    approved.assertStatus(201)
    approved.assertBodyContains({
      data: { publication: { status: 'approved', contentVersion: 1, approvedVersion: 1 } },
    })
    const persisted = await Publication.findOrFail(approvedItem.id)
    assert.equal(persisted.approvedVersion, 1)
    assert.equal(
      await PublicationReview.query()
        .where('publicationId', approvedItem.id)
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      1
    )
  })

  test('enforces roles, ownership and cross-client isolation', async ({ client, assert }) => {
    const admin = await user('admin', 'security', null)
    const agency = await user('agency', 'security', agencyA)
    const customer = await user('client', 'security', agencyA)
    const otherCustomer = await user('client', 'security-other', agencyA)
    const foreignAgency = await user('agency', 'security-foreign', agencyB)
    const parent = await project(agency, customer)
    await project(agency, otherCustomer, 'Autre projet')
    const item = await publication(agency, parent)
    const comment = await Comment.create({
      publicationId: item.id,
      authorId: customer.id,
      body: 'Visible seulement dans le projet',
      editedAt: null,
      deletedAt: null,
    })

    const otherThread = await client
      .get(`/api/v1/publications/${item.id}/discussion`)
      .loginAs(otherCustomer)
    otherThread.assertStatus(404)
    const foreignThread = await client
      .get(`/api/v1/publications/${item.id}/discussion`)
      .loginAs(foreignAgency)
    foreignThread.assertStatus(404)

    const agencyDecision = await client
      .post(`/api/v1/publications/${item.id}/reviews`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ contentVersion: 1, decision: 'approved' })
    agencyDecision.assertStatus(403)

    const otherEdit = await client
      .patch(`/api/v1/comments/${comment.id}`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ body: 'Modification interdite' })
    otherEdit.assertStatus(403)

    const moderation = await client
      .delete(`/api/v1/comments/${comment.id}`)
      .loginAs(admin)
      .withCsrfToken()
    moderation.assertStatus(204)
    assert.isNotNull(
      await AuditLog.query()
        .where('action', 'comment.moderated')
        .where('actorUserId', admin.id)
        .where('targetPublicationId', item.id)
        .first()
    )
  })

  test('marks personal notifications read and unread without exposing another account', async ({
    client,
  }) => {
    const agency = await user('agency', 'notifications', agencyA)
    const customer = await user('client', 'notifications', agencyA)
    const parent = await project(agency, customer)
    const item = await publication(agency, parent)
    await client
      .post(`/api/v1/publications/${item.id}/comments`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ body: 'Nouvelle activité' })
    const notification = await Notification.query().where('userId', agency.id).firstOrFail()

    const unread = await client.get('/api/v1/notifications?unread=true').loginAs(agency)
    unread.assertStatus(200)
    unread.assertBodyContains({ meta: { unreadCount: 1 } })

    const read = await client
      .patch(`/api/v1/notifications/${notification.id}`)
      .loginAs(agency)
      .withCsrfToken()
      .json({ read: true })
    read.assertStatus(200)

    const hidden = await client
      .patch(`/api/v1/notifications/${notification.id}`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ read: false })
    hidden.assertStatus(404)
  })
})
