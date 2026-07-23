import { createHash } from 'node:crypto'

export type PinterestPinPayload = {
  boardId: string
  title: string
  description: string
  link: string | null
}

export type PinterestValidationInput = {
  status: string
  contentVersion: number
  approvedVersion: number | null
  targetNetworks: string[]
  accountStatus: string
  accountExpiresAt?: number | null
  boardExists: boolean
  pin: PinterestPinPayload
  media: Array<{ mimeType: string; scanStatus: string; deleted: boolean }>
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

export function validatePinterestPublication(input: PinterestValidationInput) {
  const errors: string[] = []
  const warnings: string[] = []
  if (!['approved', 'scheduled'].includes(input.status))
    errors.push('La publication doit être approuvée.')
  if (input.approvedVersion !== input.contentVersion)
    errors.push('La version approuvée ne correspond plus au contenu courant.')
  if (!input.targetNetworks.includes('pinterest'))
    errors.push('Pinterest ne fait pas partie des réseaux ciblés.')
  if (input.accountStatus !== 'connected') errors.push('Le compte Pinterest doit être reconnecté.')
  if (input.accountExpiresAt && input.accountExpiresAt <= Date.now())
    errors.push('Le jeton Pinterest est expiré.')
  if (!input.boardExists) errors.push('Le tableau Pinterest sélectionné est introuvable.')
  if (!input.pin.title.trim() || input.pin.title.length > 100)
    errors.push('Le titre Pinterest doit contenir entre 1 et 100 caractères.')
  if (!input.pin.description.trim() || input.pin.description.length > 800)
    errors.push('La description Pinterest doit contenir entre 1 et 800 caractères.')
  if (input.pin.link) {
    try {
      const url = new URL(input.pin.link)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid_protocol')
    } catch {
      errors.push('Le lien Pinterest doit être une URL HTTP ou HTTPS valide.')
    }
  }
  const activeMedia = input.media.filter((media) => !media.deleted)
  if (activeMedia.length !== 1) errors.push('Un Pin doit contenir exactement une image.')
  if (activeMedia.some((media) => media.scanStatus !== 'clean'))
    errors.push('Le média doit être validé avant publication.')
  if (activeMedia.some((media) => !supportedImages.has(media.mimeType)))
    errors.push('Le média doit être une image JPEG ou PNG.')
  return { valid: errors.length === 0, errors, warnings }
}

export function pinterestIdempotencyKey(input: {
  publicationId: string
  version: number
  accountId: string
}) {
  return createHash('sha256')
    .update(`${input.publicationId}:pinterest:${input.version}:${input.accountId}`)
    .digest('hex')
}

export function pinterestPayloadHash(input: {
  pin: PinterestPinPayload
  media: Array<{ storageKey: string; mimeType: string; checksum: string; position: number }>
}) {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

export function normalizePinterestError(input: {
  name?: string
  httpStatus?: number
  code?: number | string
}): SocialPublishError {
  const code = String(input.code ?? input.name ?? 'unknown')
  if (input.name === 'AbortError' || input.name === 'TimeoutError')
    return { category: 'timeout', code, retryable: true }
  if (input.httpStatus === 429 || code === '429')
    return { category: 'rate_limit', code, retryable: true, httpStatus: input.httpStatus }
  if (input.httpStatus && input.httpStatus >= 500)
    return { category: 'server', code, retryable: true, httpStatus: input.httpStatus }
  if (input.httpStatus === 401 || code === '2')
    return { category: 'token_expired', code, retryable: false, httpStatus: input.httpStatus }
  if (input.httpStatus === 403)
    return { category: 'permission', code, retryable: false, httpStatus: input.httpStatus }
  if (input.httpStatus === 400 || input.httpStatus === 422)
    return { category: 'invalid_content', code, retryable: false, httpStatus: input.httpStatus }
  return { category: 'unknown', code, retryable: false, httpStatus: input.httpStatus }
}
