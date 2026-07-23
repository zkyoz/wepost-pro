import type { SocialNetwork } from '#domain/publications/publication_lifecycle'

export const NETWORK_VARIANT_STATUSES = ['draft', 'approved', 'stale'] as const
export type NetworkVariantStatus = (typeof NETWORK_VARIANT_STATUSES)[number]

export type EffectiveNetworkText = {
  text: string
  source: 'publication' | 'variant'
  variantId: string | null
}

export class NetworkVariantLengthError extends Error {
  constructor(public readonly limit: number) {
    super(`Le texte dépasse la limite configurée de ${limit} caractères.`)
  }
}

export function validateNetworkVariantText(text: string, limit: number | null) {
  const normalized = text.trim()
  if (!normalized) throw new Error('Le texte de la variante est obligatoire.')
  if (limit !== null && normalized.length > limit) throw new NetworkVariantLengthError(limit)
  return normalized
}

export function isNetworkVariantStale(
  variant: { sourceVersion: number; status: NetworkVariantStatus },
  currentSourceVersion: number
) {
  return variant.status === 'stale' || variant.sourceVersion !== currentSourceVersion
}

export function selectEffectiveNetworkText(
  sourceText: string,
  currentSourceVersion: number,
  variant?: {
    id: string
    text: string
    sourceVersion: number
    status: NetworkVariantStatus
    network?: SocialNetwork
  } | null
): EffectiveNetworkText {
  if (variant && variant.status === 'approved' && variant.sourceVersion === currentSourceVersion) {
    return { text: variant.text, source: 'variant', variantId: variant.id }
  }
  return { text: sourceText, source: 'publication', variantId: null }
}
