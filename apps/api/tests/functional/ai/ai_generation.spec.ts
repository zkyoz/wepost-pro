import AiGeneration from '#models/ai_generation'
import AuditLog from '#models/audit_log'
import Project from '#models/project'
import Publication from '#models/publication'
import PublicationVersion from '#models/publication_version'
import User from '#models/user'
import { publicationSnapshot } from '#services/publications/publication_service'
import { test } from '@japa/runner'

const agencyA = '00000000-0000-4000-8000-000000000018'
const agencyB = '00000000-0000-4000-8000-000000000019'

async function user(role: 'agency' | 'client', suffix: string, agencyId: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@ai.test`,
    password: 'correct-horse-battery-staple',
    role,
    agencyId,
    isActive: true,
  })
}

async function publication(owner: User, customer: User, suffix: string) {
  const parent = await Project.create({
    agencyId: owner.agencyId!,
    name: `Projet IA ${suffix}`,
    description: '',
    status: 'active',
    clientUserId: customer.id,
    timezone: 'Europe/Paris',
    createdBy: owner.id,
  })
  const item = await Publication.create({
    agencyId: owner.agencyId!,
    projectId: parent.id,
    title: `Publication IA ${suffix}`,
    baseText: 'Texte source conservé.',
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

const generationPayload = {
  brief: 'Présenter clairement notre nouvelle offre responsable.',
  tone: 'professional',
  length: 'short',
  language: 'fr',
  variantCount: 3,
}

test.group('AI text generation HTTP', () => {
  test('generates, lists and manually applies one proposal without publishing', async ({
    client,
    assert,
  }) => {
    const owner = await user('agency', 'nominal', agencyA)
    const customer = await user('client', 'nominal', agencyA)
    const item = await publication(owner, customer, 'nominal')

    const created = await client
      .post(`/api/v1/publications/${item.id}/ai-generations`)
      .loginAs(owner)
      .withCsrfToken()
      .json(generationPayload)
    created.assertStatus(201)
    created.assertBodyContains({
      data: { provider: 'mock', promptVersion: 'text-v1', status: 'completed' },
    })
    const createdData = created.body().data as {
      id: string
      variants: Array<{ id: string; text: string }>
    }
    assert.lengthOf(createdData.variants, 3)
    assert.notProperty(createdData, 'brief')

    const list = await client.get(`/api/v1/publications/${item.id}/ai-generations`).loginAs(owner)
    list.assertStatus(200)
    assert.lengthOf(list.body().data as unknown[], 1)

    const applied = await client
      .post(`/api/v1/ai-generations/${createdData.id}/apply`)
      .loginAs(owner)
      .withCsrfToken()
      .json({ variantId: 'variant-1', contentVersion: 1 })
    applied.assertStatus(200)
    applied.assertBodyContains({ data: { publication: { status: 'draft', contentVersion: 2 } } })
    assert.equal(applied.body().data.generation.appliedVariantId, 'variant-1')

    await item.refresh()
    assert.include(item.baseText, 'À retenir')
    assert.equal(item.contentVersion, 2)
    assert.equal(item.status, 'draft')
    assert.equal(
      await PublicationVersion.query()
        .where('publicationId', item.id)
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      2
    )
    assert.equal(
      await AuditLog.query()
        .where('targetPublicationId', item.id)
        .whereIn('action', ['ai.generation_created', 'ai.variant_applied'])
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      2
    )
  })

  test('denies clients, cross-agency access and invalid input', async ({ client }) => {
    const owner = await user('agency', 'secure', agencyA)
    const customer = await user('client', 'secure', agencyA)
    const outsideOwner = await user('agency', 'outside', agencyB)
    const item = await publication(owner, customer, 'secure')

    await client
      .post(`/api/v1/publications/${item.id}/ai-generations`)
      .loginAs(customer)
      .withCsrfToken()
      .json(generationPayload)
      .then((response) => response.assertStatus(403))
    await client
      .post(`/api/v1/publications/${item.id}/ai-generations`)
      .loginAs(outsideOwner)
      .withCsrfToken()
      .json(generationPayload)
      .then((response) => response.assertStatus(404))
    await client
      .post(`/api/v1/publications/${item.id}/ai-generations`)
      .loginAs(owner)
      .withCsrfToken()
      .json({ ...generationPayload, brief: 'court', variantCount: 9 })
      .then((response) => response.assertStatus(422))
  })

  test('enforces the daily quota independently from the rate limiter', async ({ client }) => {
    const owner = await user('agency', 'quota', agencyA)
    const customer = await user('client', 'quota', agencyA)
    const item = await publication(owner, customer, 'quota')
    await AiGeneration.createMany(
      Array.from({ length: 50 }, (_, index) => ({
        agencyId: agencyA,
        publicationId: item.id,
        provider: 'mock',
        model: 'mock-text-v1',
        promptVersion: 'text-v1',
        inputHash: index.toString(16).padStart(64, '0'),
        outputJson: { variants: [], warnings: [] },
        status: 'completed' as const,
        usageJson: {},
        errorCode: null,
        appliedVariantId: null,
        createdBy: owner.id,
        completedAt: null,
        cancelledAt: null,
        appliedAt: null,
      }))
    )
    const response = await client
      .post(`/api/v1/publications/${item.id}/ai-generations`)
      .loginAs(owner)
      .withCsrfToken()
      .json(generationPayload)
    response.assertStatus(429)
    response.assertBodyContains({ errors: [{ message: 'Quota quotidien IA atteint.' }] })
  })

  test('cancels queued work and refuses cancellation after completion', async ({
    client,
    assert,
  }) => {
    const owner = await user('agency', 'cancel', agencyA)
    const customer = await user('client', 'cancel', agencyA)
    const item = await publication(owner, customer, 'cancel')
    const common = {
      agencyId: agencyA,
      publicationId: item.id,
      provider: 'mock',
      model: 'mock-text-v1',
      promptVersion: 'text-v1',
      inputHash: 'f'.repeat(64),
      outputJson: { variants: [], warnings: [] },
      usageJson: {},
      errorCode: null,
      appliedVariantId: null,
      createdBy: owner.id,
      completedAt: null,
      cancelledAt: null,
      appliedAt: null,
    }
    const queued = await AiGeneration.create({ ...common, status: 'queued' })
    const completed = await AiGeneration.create({
      ...common,
      inputHash: 'e'.repeat(64),
      status: 'completed',
    })
    await client
      .post(`/api/v1/ai-generations/${queued.id}/cancel`)
      .loginAs(owner)
      .withCsrfToken()
      .then((response) => response.assertStatus(200))
    await queued.refresh()
    assert.equal(queued.status, 'cancelled')
    await client
      .post(`/api/v1/ai-generations/${completed.id}/cancel`)
      .loginAs(owner)
      .withCsrfToken()
      .then((response) => response.assertStatus(409))
  })
})
