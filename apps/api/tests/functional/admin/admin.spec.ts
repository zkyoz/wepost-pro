import AuditLog from '#models/audit_log'
import Project from '#models/project'
import Publication from '#models/publication'
import PublicationAttempt from '#models/publication_attempt'
import ScheduledPublication from '#models/scheduled_publication'
import SocialAccount from '#models/social_account'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const agencyId = '00000000-0000-4000-8000-000000000001'

async function user(role: 'admin' | 'agency' | 'client', suffix: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@example.test`,
    password: 'correct-horse-battery-staple',
    role,
    agencyId: role === 'admin' ? null : agencyId,
    isActive: true,
  })
}

async function resources(owner: User, clientUser: User) {
  const project = await Project.create({
    agencyId,
    name: 'Projet administration',
    description: 'Projet de test',
    status: 'active',
    clientUserId: clientUser.id,
    timezone: 'Europe/Paris',
    createdBy: owner.id,
  })
  const publication = await Publication.create({
    agencyId,
    projectId: project.id,
    title: 'Publication administration',
    baseText: 'Contenu sans secret',
    status: 'draft',
    targetNetworks: ['facebook'],
    scheduledAt: null,
    timezone: 'Europe/Paris',
    contentVersion: 1,
    approvedVersion: null,
    createdBy: owner.id,
    updatedBy: owner.id,
    archivedAt: null,
  })
  const account = await SocialAccount.create({
    agencyId,
    network: 'facebook',
    externalAccountId: 'external-private-1234',
    externalAccountName: 'Page de test',
    encryptedAccessToken: 'ciphertext-access',
    encryptedRefreshToken: 'ciphertext-refresh',
    expiresAt: DateTime.utc().plus({ days: 1 }),
    scopes: ['pages_manage_posts'],
    metadataJson: { accessToken: 'must-not-leak' },
    status: 'connected',
    createdBy: owner.id,
    revokedAt: null,
  })
  const schedule = await ScheduledPublication.create({
    publicationId: publication.id,
    network: 'facebook',
    accountId: account.id,
    publicationVersion: 1,
    runAt: DateTime.utc(),
    status: 'failed',
    idempotencyKey: 'a'.repeat(64),
    payloadHash: 'b'.repeat(64),
    networkPayloadJson: {},
    providerJobId: null,
    providerStatus: null,
  })
  const incident = await PublicationAttempt.create({
    scheduledId: schedule.id,
    attempt: 1,
    startedAt: DateTime.utc(),
    finishedAt: DateTime.utc(),
    result: 'permanent_failure',
    normalizedError: { code: 'provider_error', accessToken: 'must-not-leak' },
    remotePostId: null,
  })
  return { project, publication, account, incident }
}

test.group('Global administrator CRUD', () => {
  test('lists, filters and reads every safe administration resource', async ({
    client,
    assert,
  }) => {
    const admin = await user('admin', 'read')
    const owner = await user('agency', 'read')
    const customer = await user('client', 'read')
    const created = await resources(owner, customer)

    const overview = await client.get('/api/v1/admin/overview').loginAs(admin)
    overview.assertStatus(200)
    overview.assertBodyContains({ data: { users: { active: 3 }, incidents: { total: 1 } } })

    const users = await client
      .get('/api/v1/admin/users')
      .qs({ q: customer.email, role: 'client', status: 'active', perPage: 1 })
      .loginAs(admin)
    users.assertStatus(200)
    users.assertBodyContains({ data: [{ id: customer.id }], meta: { perPage: 1 } })

    for (const [path, id] of [
      ['projects', created.project.id],
      ['publications', created.publication.id],
      ['social-accounts', created.account.id],
      ['incidents', created.incident.id],
    ]) {
      const list = await client.get(`/api/v1/admin/${path}`).loginAs(admin)
      const detail = await client.get(`/api/v1/admin/${path}/${id}`).loginAs(admin)
      list.assertStatus(200)
      detail.assertStatus(200)
      detail.assertBodyContains({ data: { id } })
      if (path === 'social-accounts') {
        detail.assertBodyNotContains({ data: { encryptedAccessToken: 'ciphertext-access' } })
        assert.notInclude(JSON.stringify(detail.body()), 'ciphertext-access')
        assert.notInclude(JSON.stringify(detail.body()), 'must-not-leak')
      }
      if (path === 'incidents') assert.notInclude(JSON.stringify(detail.body()), 'must-not-leak')
    }

    const audits = await client.get('/api/v1/admin/audit-logs').loginAs(admin)
    audits.assertStatus(200)
  })

  test('archives and restores projects and publications through dedicated actions', async ({
    client,
    assert,
  }) => {
    const admin = await user('admin', 'archive')
    const owner = await user('agency', 'archive')
    const customer = await user('client', 'archive')
    const { project, publication } = await resources(owner, customer)

    await client
      .post(`/api/v1/admin/projects/${project.id}/archive`)
      .loginAs(admin)
      .withCsrfToken()
      .json({ agencyId: 'forged' })
      .then((response) => response.assertStatus(200))
    await project.refresh()
    assert.equal(project.status, 'archived')
    await client
      .post(`/api/v1/admin/projects/${project.id}/restore`)
      .loginAs(admin)
      .withCsrfToken()
      .then((response) => response.assertStatus(200))
    await project.refresh()
    assert.equal(project.status, 'active')

    await client
      .post(`/api/v1/admin/publications/${publication.id}/archive`)
      .loginAs(admin)
      .withCsrfToken()
      .then((response) => response.assertStatus(200))
    await publication.refresh()
    assert.equal(publication.status, 'archived')
    await client
      .post(`/api/v1/admin/publications/${publication.id}/restore`)
      .loginAs(admin)
      .withCsrfToken()
      .then((response) => response.assertStatus(200))
    await publication.refresh()
    assert.equal(publication.status, 'draft')
    const auditEntries = await AuditLog.query().where('actorUserId', admin.id)
    assert.isAtLeast(auditEntries.length, 1)
  })

  test('denies every administration route to agency and client accounts', async ({ client }) => {
    const admin = await user('admin', 'deny')
    const owner = await user('agency', 'deny')
    const customer = await user('client', 'deny')
    const created = await resources(owner, customer)
    const reads = [
      '/api/v1/admin/overview',
      '/api/v1/admin/users',
      `/api/v1/admin/users/${customer.id}`,
      '/api/v1/admin/projects',
      `/api/v1/admin/projects/${created.project.id}`,
      '/api/v1/admin/publications',
      `/api/v1/admin/publications/${created.publication.id}`,
      '/api/v1/admin/social-accounts',
      `/api/v1/admin/social-accounts/${created.account.id}`,
      '/api/v1/admin/incidents',
      `/api/v1/admin/incidents/${created.incident.id}`,
      '/api/v1/admin/audit-logs',
    ]
    const writes = [
      [`/api/v1/admin/users/${customer.id}/role`, { role: 'admin' }],
      [`/api/v1/admin/users/${customer.id}/status`, { isActive: false }],
      [`/api/v1/admin/projects/${created.project.id}/archive`, {}],
      [`/api/v1/admin/projects/${created.project.id}/restore`, {}],
      [`/api/v1/admin/publications/${created.publication.id}/archive`, {}],
      [`/api/v1/admin/publications/${created.publication.id}/restore`, {}],
    ] as const

    for (const actor of [owner, customer]) {
      for (const path of reads) {
        const response = await client.get(path).loginAs(actor)
        response.assertStatus(403)
      }
      for (const [path, body] of writes) {
        const request = path.includes('/users/')
          ? client.patch(path as string)
          : client.post(path as string)
        const response = await request
          .loginAs(actor)
          .withCsrfToken()
          .json(body as Record<string, unknown>)
        response.assertStatus(403)
      }
    }
    admin.id // prevents an accidental optimization from hiding the required active admin fixture
  })

  test('keeps audit entries immutable and redacts sensitive audit metadata', async ({
    client,
    assert,
  }) => {
    const admin = await user('admin', 'audit')
    const target = await user('client', 'audit')
    const entry = await AuditLog.create({
      actorUserId: admin.id,
      targetUserId: target.id,
      action: 'user.deactivated',
      previousValues: { isActive: true, password: 'must-not-leak' },
      nextValues: { isActive: false },
    })
    const response = await client.get('/api/v1/admin/audit-logs').loginAs(admin)
    response.assertStatus(200)
    assert.notInclude(JSON.stringify(response.body()), 'must-not-leak')
    response.assertBodyContains({
      data: [{ previousValues: { isActive: true, password: '[REDACTED]' } }],
    })
    await assert.rejects(() =>
      db.from('audit_logs').where('id', entry.id).update({ action: 'user.reactivated' })
    )
    await assert.rejects(() => db.from('audit_logs').where('id', entry.id).delete())
  })
})
