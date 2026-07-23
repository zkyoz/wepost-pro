import { createHash } from 'node:crypto'

export type FacebookMediaInput = {
  mimeType: string
  scanStatus: string
  deleted: boolean
}

export type FacebookValidationInput = {
  status: string
  contentVersion: number
  approvedVersion: number | null
  targetNetworks: string[]
  baseText: string
  accountStatus: string
  accountExpiresAt?: number | null
  media: FacebookMediaInput[]
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

const supportedImages = new Set(['image/jpeg', 'image/png', 'image/gif'])
const supportedVideos = new Set(['video/mp4'])

export function validateFacebookPublication(input: FacebookValidationInput) {
  const errors: string[] = []
  const warnings: string[] = []
  if (!['approved', 'scheduled'].includes(input.status)) {
    errors.push('La publication doit être approuvée.')
  }
  if (input.approvedVersion !== input.contentVersion) {
    errors.push('La version approuvée ne correspond plus au contenu courant.')
  }
  if (!input.targetNetworks.includes('facebook')) {
    errors.push('Facebook ne fait pas partie des réseaux ciblés.')
  }
  if (input.accountStatus !== 'connected') errors.push('Le compte Facebook doit être reconnecté.')
  if (input.accountExpiresAt && input.accountExpiresAt <= Date.now()) {
    errors.push('Le jeton Facebook est expiré.')
  }
  const activeMedia = input.media.filter((media) => !media.deleted)
  if (!input.baseText.trim() && activeMedia.length === 0) {
    errors.push('Ajoutez du texte ou un média avant la publication.')
  }
  if (activeMedia.some((media) => media.scanStatus !== 'clean')) {
    errors.push('Tous les médias doivent être validés avant publication.')
  }
  const unsupported = activeMedia.filter(
    (media) => !supportedImages.has(media.mimeType) && !supportedVideos.has(media.mimeType)
  )
  if (unsupported.length) errors.push('Un média utilise un format non pris en charge par Facebook.')
  const videos = activeMedia.filter((media) => supportedVideos.has(media.mimeType))
  if (videos.length > 1 || (videos.length === 1 && activeMedia.length > 1)) {
    errors.push('Une publication vidéo ne peut contenir qu’une seule vidéo.')
  }
  if (!input.baseText.trim()) warnings.push('La publication sera envoyée sans texte.')
  return { valid: errors.length === 0, errors, warnings }
}

export function facebookIdempotencyKey(input: {
  publicationId: string
  version: number
  accountId: string
}) {
  return createHash('sha256')
    .update(`${input.publicationId}:facebook:${input.version}:${input.accountId}`)
    .digest('hex')
}

export function facebookPayloadHash(input: {
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

export function normalizeFacebookError(input: {
  name?: string
  httpStatus?: number
  code?: number | string
  subcode?: number | string
}): SocialPublishError {
  const code = String(input.subcode ?? input.code ?? input.name ?? 'unknown')
  if (input.name === 'AbortError' || input.name === 'TimeoutError') {
    return { category: 'timeout', code, retryable: true }
  }
  if (input.httpStatus === 429 || String(input.code) === '4') {
    return { category: 'rate_limit', code, retryable: true, httpStatus: input.httpStatus }
  }
  if (input.httpStatus && input.httpStatus >= 500) {
    return { category: 'server', code, retryable: true, httpStatus: input.httpStatus }
  }
  if (String(input.code) === '190') {
    return { category: 'token_expired', code, retryable: false, httpStatus: input.httpStatus }
  }
  if (String(input.code) === '200' || String(input.code) === '10') {
    return { category: 'permission', code, retryable: false, httpStatus: input.httpStatus }
  }
  if (String(input.code) === '100' || input.httpStatus === 400) {
    return { category: 'invalid_content', code, retryable: false, httpStatus: input.httpStatus }
  }
  return { category: 'unknown', code, retryable: false, httpStatus: input.httpStatus }
}
