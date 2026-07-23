import { createHash } from 'node:crypto'

export type LinkedInMediaInput = {
  mimeType: string
  scanStatus: string
  deleted: boolean
}

export type LinkedInValidationInput = {
  status: string
  contentVersion: number
  approvedVersion: number | null
  targetNetworks: string[]
  baseText: string
  accountStatus: string
  accountExpiresAt?: number | null
  media: LinkedInMediaInput[]
}

export type SocialPublishError = {
  category:
    | 'timeout'
    | 'rate_limit'
    | 'server'
    | 'token_expired'
    | 'permission'
    | 'invalid_content'
    | 'unknown'
  code: string
  retryable: boolean
  httpStatus?: number
}

const supportedImages = new Set(['image/jpeg', 'image/png'])

export function validateLinkedInPublication(input: LinkedInValidationInput) {
  const errors: string[] = []
  const warnings: string[] = []
  if (!['approved', 'scheduled'].includes(input.status)) {
    errors.push('La publication doit être approuvée.')
  }
  if (input.approvedVersion !== input.contentVersion) {
    errors.push('La version approuvée ne correspond plus au contenu courant.')
  }
  if (!input.targetNetworks.includes('linkedin')) {
    errors.push('LinkedIn ne fait pas partie des réseaux ciblés.')
  }
  if (input.accountStatus !== 'connected') errors.push('Le compte LinkedIn doit être reconnecté.')
  if (input.accountExpiresAt && input.accountExpiresAt <= Date.now()) {
    errors.push('Le jeton LinkedIn est expiré.')
  }
  const activeMedia = input.media.filter((media) => !media.deleted)
  if (activeMedia.length > 1) {
    errors.push('Cette version prend en charge au maximum une image.')
  }
  if (activeMedia.some((media) => media.scanStatus !== 'clean')) {
    errors.push('Tous les médias doivent être validés avant publication.')
  }
  const unsupported = activeMedia.filter((media) => !supportedImages.has(media.mimeType))
  if (unsupported.length) errors.push('Un média utilise un format non pris en charge par LinkedIn.')
  if (!input.baseText.trim()) errors.push('Le texte LinkedIn est obligatoire.')
  if (input.baseText.length > 3000) errors.push('Le texte LinkedIn dépasse 3 000 caractères.')
  return { valid: errors.length === 0, errors, warnings }
}

export function linkedinIdempotencyKey(input: {
  publicationId: string
  version: number
  accountId: string
}) {
  return createHash('sha256')
    .update(`${input.publicationId}:linkedin:${input.version}:${input.accountId}`)
    .digest('hex')
}

export function linkedinPayloadHash(input: {
  text: string
  media: Array<{ storageKey: string; mimeType: string; checksum: string; position: number }>
}) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        text: input.text,
        media: input.media.map(({ storageKey, mimeType, checksum, position }) => ({
          storageKey,
          mimeType,
          checksum,
          position,
        })),
      })
    )
    .digest('hex')
}

export function normalizeLinkedInError(input: {
  name?: string
  httpStatus?: number
  code?: number | string
  subcode?: number | string
}): SocialPublishError {
  const code = String(input.subcode ?? input.code ?? input.name ?? 'unknown')
  if (input.name === 'AbortError' || input.name === 'TimeoutError') {
    return { category: 'timeout', code, retryable: true }
  }
  if (input.httpStatus === 429 || String(input.code) === '429') {
    return { category: 'rate_limit', code, retryable: true, httpStatus: input.httpStatus }
  }
  if (input.httpStatus && input.httpStatus >= 500) {
    return { category: 'server', code, retryable: true, httpStatus: input.httpStatus }
  }
  if (input.httpStatus === 401 || String(input.code) === '401') {
    return { category: 'token_expired', code, retryable: false, httpStatus: input.httpStatus }
  }
  if (input.httpStatus === 403 || String(input.code) === '403') {
    return { category: 'permission', code, retryable: false, httpStatus: input.httpStatus }
  }
  if (input.httpStatus === 400 || input.httpStatus === 422) {
    return { category: 'invalid_content', code, retryable: false, httpStatus: input.httpStatus }
  }
  return { category: 'unknown', code, retryable: false, httpStatus: input.httpStatus }
}
