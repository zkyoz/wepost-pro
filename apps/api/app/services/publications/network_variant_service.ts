import { parseAiProviderOutput, type AiGenerationInput } from '#domain/ai/text_generation'
import type { SocialNetwork } from '#domain/publications/publication_lifecycle'
import {
  selectEffectiveNetworkText,
  validateNetworkVariantText,
} from '#domain/publications/network_variant'
import PublicationNetworkVariant from '#models/publication_network_variant'
import type Publication from '#models/publication'
import { getConfiguredAiProvider } from '#services/ai/ai_generation_service'
import env from '#start/env'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

const limitKeys: Record<SocialNetwork, Parameters<typeof env.get>[0]> = {
  facebook: 'NETWORK_TEXT_LIMIT_FACEBOOK',
  instagram: 'NETWORK_TEXT_LIMIT_INSTAGRAM',
  linkedin: 'NETWORK_TEXT_LIMIT_LINKEDIN',
  pinterest: 'NETWORK_TEXT_LIMIT_PINTEREST',
  tiktok: 'NETWORK_TEXT_LIMIT_TIKTOK',
}

export function networkTextLimit(network: SocialNetwork): number | null {
  return (env.get(limitKeys[network]) as number | undefined) ?? null
}

export function toNetworkVariantView(
  variant: PublicationNetworkVariant,
  currentSourceVersion: number
) {
  const stale = variant.status === 'stale' || variant.sourceVersion !== currentSourceVersion
  return {
    id: variant.id,
    publicationId: variant.publicationId,
    network: variant.network,
    sourceVersion: variant.sourceVersion,
    text: variant.text,
    status: stale ? ('stale' as const) : variant.status,
    generatedByAi: variant.generatedByAi,
    createdBy: variant.createdBy,
    approvedBy: variant.approvedBy,
    approvedAt: variant.approvedAt?.toUTC().toISO() ?? null,
    staleAt: variant.staleAt?.toUTC().toISO() ?? null,
    createdAt: variant.createdAt.toUTC().toISO()!,
    updatedAt: variant.updatedAt.toUTC().toISO()!,
    textLimit: networkTextLimit(variant.network),
  }
}

export async function effectiveNetworkText(publication: Publication, network: SocialNetwork) {
  const variant = await PublicationNetworkVariant.query()
    .where('publicationId', publication.id)
    .where('network', network)
    .where('sourceVersion', publication.contentVersion)
    .where('status', 'approved')
    .first()
  return selectEffectiveNetworkText(publication.baseText, publication.contentVersion, variant)
}

export async function markNetworkVariantsStale(
  publicationId: string,
  nextSourceVersion: number,
  trx?: TransactionClientContract
) {
  return PublicationNetworkVariant.query(trx ? { client: trx } : undefined)
    .where('publicationId', publicationId)
    .whereNot('status', 'stale')
    .where('sourceVersion', '<', nextSourceVersion)
    .update({ status: 'stale', staleAt: DateTime.utc(), approvedBy: null, approvedAt: null })
}

export async function generateNetworkVariantText(
  publication: Publication,
  network: SocialNetwork,
  options: Pick<AiGenerationInput, 'tone' | 'length' | 'language'>
) {
  const provider = getConfiguredAiProvider()
  const input: AiGenerationInput = {
    brief: `Adapte pour ${network}, sans ajouter d’information : ${publication.baseText}`,
    variantCount: 2,
    ...options,
  }
  const result = await provider.generate(input)
  const generated = parseAiProviderOutput(result.output, input)[0]?.text ?? ''
  return {
    text: validateNetworkVariantText(generated, networkTextLimit(network)),
    provider: provider.name,
    model: provider.model,
  }
}
