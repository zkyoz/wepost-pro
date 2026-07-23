import AuditLog from '#models/audit_log'
import Project from '#models/project'
import Publication from '#models/publication'
import PublicationTranslation from '#models/publication_translation'
import PublicationVersion from '#models/publication_version'
import User from '#models/user'
import { publicationSnapshot } from '#services/publications/publication_service'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

const agencyA = '00000000-0000-4000-8000-000000000024'
const agencyB = '00000000-0000-4000-8000-000000000025'

async function user(role: 'agency' | 'client', suffix: string, agencyId: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@translations.test`,
    password: 'correct-horse-battery-staple',
    role,
    locale: 'fr',
    agencyId,
    isActive: true,
  })
}

async function publication(owner: User, customer: User, suffix: string) {
  const project = await Project.create({
    agencyId: owner.agencyId!,
    name: `Projet traduction ${suffix}`,
    description: '',
    status: 'active',
    clientUserId: customer.id,
    timezone: 'Europe/Paris',
    createdBy: owner.id,
  })
  await db.table('project_members').insert({
    project_id: project.id,
    user_id: customer.id,
    membership_role: 'primary',
    created_at: new Date(),
  })
  const item = await Publication.create({
    agencyId: owner.agencyId!,
    projectId: project.id,
    title: `Publication traduction ${suffix}`,
    baseText: 'Le texte source français reste conservé.',
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
  await PublicationVersion.create({
    publicationId: item.id,
    version: 1,
    snapshotJson: publicationSnapshot(item),
    authorId: owner.id,
  })
  return item
}

test.group('Locales and publication translations HTTP', () => {
  test('persists every authenticated user locale and returns it in the profile', async ({
    client,
  }) => {
    const actor = await user('client', 'locale', agencyA)
    const updated = await client
      .patch('/api/v1/users/me/locale')
      .loginAs(actor)
      .withCsrfToken()
      .json({ locale: 'en' })
    updated.assertStatus(200)
    updated.assertBodyContains({ data: { id: actor.id, locale: 'en' } })
    await client
      .get('/api/v1/auth/me')
      .loginAs(actor)
      .then((response) => {
        response.assertStatus(200)
        response.assertBodyContains({ data: { locale: 'en' } })
      })
    await client
      .patch('/api/v1/users/me/locale')
      .loginAs(actor)
      .withCsrfToken()
      .json({ locale: 'es' as never })
      .then((response) => response.assertStatus(422))
  })

  test('generates, edits and explicitly approves a versioned translation', async ({
    client,
    assert,
  }) => {
    const owner = await user('agency', 'nominal', agencyA)
    const customer = await user('client', 'nominal', agencyA)
    const item = await publication(owner, customer, 'nominal')
    const generated = await client
      .post(`/api/v1/publications/${item.id}/translations/generate`)
      .loginAs(owner)
      .withCsrfToken()
      .json({ sourceLocale: 'fr', targetLocale: 'en', sourceVersion: 1 })
    generated.assertStatus(201)
    generated.assertBodyContains({
      data: {
        sourceLocale: 'fr',
        targetLocale: 'en',
        sourceVersion: 1,
        status: 'draft',
        generatedByAi: true,
        provider: 'mock',
      },
    })
    assert.notEqual(generated.body().data.text, item.baseText)

    const edited = await client
      .put(`/api/v1/publications/${item.id}/translations/en`)
      .loginAs(owner)
      .withCsrfToken()
      .json({
        sourceLocale: 'fr',
        sourceVersion: 1,
        text: 'The source text remains preserved.',
      })
    edited.assertStatus(200)
    edited.assertBodyContains({
      data: { text: 'The source text remains preserved.', generatedByAi: false, status: 'draft' },
    })

    const approved = await client
      .post(`/api/v1/publications/${item.id}/translations/en/approve`)
      .loginAs(owner)
      .withCsrfToken()
      .json({ sourceVersion: 1 })
    approved.assertStatus(200)
    approved.assertBodyContains({ data: { status: 'approved' } })
    assert.isNotNull(approved.body().data.approvedAt)

    const readByClient = await client
      .get(`/api/v1/publications/${item.id}/translations`)
      .loginAs(customer)
    readByClient.assertStatus(200)
    assert.equal(readByClient.body().meta.sourceText, item.baseText)
    assert.equal(
      await AuditLog.query()
        .where('targetPublicationId', item.id)
        .whereIn('action', [
          'publication.translation_generated',
          'publication.translation_updated',
          'publication.translation_approved',
        ])
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      3
    )
  })

  test('marks translations stale after a source change and denies client or IDOR writes', async ({
    client,
    assert,
  }) => {
    const owner = await user('agency', 'secure', agencyA)
    const customer = await user('client', 'secure', agencyA)
    const outsider = await user('agency', 'outside', agencyB)
    const item = await publication(owner, customer, 'secure')
    await client
      .put(`/api/v1/publications/${item.id}/translations/en`)
      .loginAs(owner)
      .withCsrfToken()
      .json({ sourceLocale: 'fr', sourceVersion: 1, text: 'Version one.' })
      .then((response) => response.assertStatus(200))

    await client
      .post(`/api/v1/publications/${item.id}/translations/generate`)
      .loginAs(customer)
      .withCsrfToken()
      .json({ sourceLocale: 'fr', targetLocale: 'en', sourceVersion: 1 })
      .then((response) => response.assertStatus(403))
    await client
      .put(`/api/v1/publications/${item.id}/translations/en`)
      .loginAs(outsider)
      .withCsrfToken()
      .json({ sourceLocale: 'fr', sourceVersion: 1, text: 'Forbidden.' })
      .then((response) => response.assertStatus(404))

    await client
      .patch(`/api/v1/publications/${item.id}`)
      .loginAs(owner)
      .withCsrfToken()
      .json({ contentVersion: 1, baseText: 'Texte source version deux.' })
      .then((response) => response.assertStatus(200))
    const translation = await PublicationTranslation.query()
      .where('publicationId', item.id)
      .firstOrFail()
    assert.equal(translation.status, 'stale')

    const listed = await client
      .get(`/api/v1/publications/${item.id}/translations`)
      .loginAs(customer)
    listed.assertBodyContains({ data: [{ status: 'stale', approvedAt: null }] })
  })
})
