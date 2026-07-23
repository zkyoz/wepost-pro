import Project from '#models/project'
import Publication from '#models/publication'
import PublicationNetworkVariant from '#models/publication_network_variant'
import PublicationVersion from '#models/publication_version'
import User from '#models/user'
import { publicationSnapshot } from '#services/publications/publication_service'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

const agencyA = '00000000-0000-4000-8000-000000000020'
const agencyB = '00000000-0000-4000-8000-000000000021'

async function user(role: 'agency' | 'client', suffix: string, agencyId: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@network-variants.test`,
    password: 'correct-horse-battery-staple',
    role,
    agencyId,
    isActive: true,
  })
}

async function publication(owner: User, customer: User, suffix: string) {
  const project = await Project.create({
    agencyId: owner.agencyId!,
    name: `Projet variantes ${suffix}`,
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
    title: `Publication variantes ${suffix}`,
    baseText: 'Texte source de la publication.',
    status: 'draft',
    targetNetworks: ['facebook', 'linkedin'],
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

const generation = {
  networks: ['facebook', 'linkedin'] as ('facebook' | 'linkedin')[],
  tone: 'professional' as const,
  length: 'medium' as const,
  language: 'fr' as const,
}

test.group('Publication network variants HTTP', () => {
  test('generates, edits, approves and resolves the effective text', async ({ client, assert }) => {
    const owner = await user('agency', 'nominal', agencyA)
    const customer = await user('client', 'nominal', agencyA)
    const item = await publication(owner, customer, 'nominal')

    const generated = await client
      .post(`/api/v1/publications/${item.id}/network-variants/generate`)
      .loginAs(owner)
      .withCsrfToken()
      .json(generation)
    generated.assertStatus(201)
    const generatedVariants = generated.body().data as Array<{
      id: string
      network: string
      generatedByAi: boolean
    }>
    assert.lengthOf(generatedVariants, 2)
    const linkedin = generatedVariants.find((variant) => variant.network === 'linkedin')
    if (!linkedin) throw new Error('Variante LinkedIn absente du résultat de test.')
    assert.isTrue(linkedin.generatedByAi)

    const edited = await client
      .patch(`/api/v1/network-variants/${linkedin.id}`)
      .loginAs(owner)
      .withCsrfToken()
      .json({ text: 'Variante LinkedIn relue et corrigée.' })
    edited.assertStatus(200)
    edited.assertBodyContains({
      data: { status: 'draft', text: 'Variante LinkedIn relue et corrigée.' },
    })

    await client
      .post(`/api/v1/network-variants/${linkedin.id}/approve`)
      .loginAs(owner)
      .withCsrfToken()
      .then((response) => response.assertStatus(200))

    const effective = await client
      .get(`/api/v1/publications/${item.id}/network-variants/linkedin/effective`)
      .loginAs(owner)
    effective.assertStatus(200)
    effective.assertBodyContains({
      data: {
        text: 'Variante LinkedIn relue et corrigée.',
        source: 'variant',
        variantId: linkedin.id,
      },
    })
  })

  test('marks variants stale when the source changes and falls back to source text', async ({
    client,
    assert,
  }) => {
    const owner = await user('agency', 'stale', agencyA)
    const customer = await user('client', 'stale', agencyA)
    const item = await publication(owner, customer, 'stale')
    const created = await client
      .post(`/api/v1/publications/${item.id}/network-variants`)
      .loginAs(owner)
      .withCsrfToken()
      .json({ network: 'linkedin', text: 'Variante version un.' })
    const id = (created.body().data as { id: string }).id
    await client.post(`/api/v1/network-variants/${id}/approve`).loginAs(owner).withCsrfToken()

    await client
      .patch(`/api/v1/publications/${item.id}`)
      .loginAs(owner)
      .withCsrfToken()
      .json({ contentVersion: 1, baseText: 'Nouveau texte source version deux.' })
      .then((response) => response.assertStatus(200))

    const persisted = await PublicationNetworkVariant.findOrFail(id)
    assert.equal(persisted.status, 'stale')
    assert.isNotNull(persisted.staleAt)
    const effective = await client
      .get(`/api/v1/publications/${item.id}/network-variants/linkedin/effective`)
      .loginAs(owner)
    effective.assertBodyContains({
      data: { text: 'Nouveau texte source version deux.', source: 'publication', variantId: null },
    })
  })

  test('enforces management permissions, client review scope and IDOR protection', async ({
    client,
  }) => {
    const owner = await user('agency', 'security', agencyA)
    const customer = await user('client', 'security', agencyA)
    const outsider = await user('agency', 'outside', agencyB)
    const item = await publication(owner, customer, 'security')
    item.status = 'awaiting_client_review'
    await item.save()
    const created = await client
      .post(`/api/v1/publications/${item.id}/network-variants`)
      .loginAs(owner)
      .withCsrfToken()
      .json({ network: 'facebook', text: 'Variante à faire valider.' })
    const id = (created.body().data as { id: string }).id

    await client
      .get(`/api/v1/publications/${item.id}/network-variants`)
      .loginAs(customer)
      .then((response) => response.assertStatus(200))
    await client
      .post(`/api/v1/publications/${item.id}/network-variants/generate`)
      .loginAs(customer)
      .withCsrfToken()
      .json(generation)
      .then((response) => response.assertStatus(403))
    await client
      .post(`/api/v1/network-variants/${id}/approve`)
      .loginAs(customer)
      .withCsrfToken()
      .then((response) => response.assertStatus(200))
    await client
      .get(`/api/v1/publications/${item.id}/network-variants`)
      .loginAs(outsider)
      .then((response) => response.assertStatus(404))
  })
})
