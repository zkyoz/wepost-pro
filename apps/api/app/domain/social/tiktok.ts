import { createHash } from 'node:crypto'

export const TIKTOK_PRIVACY_LEVELS = [
  'PUBLIC_TO_EVERYONE',
  'MUTUAL_FOLLOW_FRIENDS',
  'FOLLOWER_OF_CREATOR',
  'SELF_ONLY',
] as const

export type TikTokPrivacyLevel = (typeof TIKTOK_PRIVACY_LEVELS)[number]

export type TikTokVideoPayload = {
  privacyLevel: TikTokPrivacyLevel
  caption: string
  disableComment: boolean
  disableDuet: boolean
  disableStitch: boolean
  brandContentToggle: boolean
  brandOrganicToggle: boolean
  isAigc: boolean
}

export type TikTokCreatorInfo = {
  privacyLevelOptions: string[]
  commentDisabled: boolean
  duetDisabled: boolean
  stitchDisabled: boolean
  maxVideoPostDurationSec: number
}

export type TikTokValidationInput = {
  status: string
  contentVersion: number
  approvedVersion: number | null
  targetNetworks: string[]
  accountStatus: string
  accountExpiresAt?: number | null
  creator: TikTokCreatorInfo
  video: TikTokVideoPayload
  media: Array<{
    mimeType: string
    scanStatus: string
    deleted: boolean
    sizeBytes: number
    width: number | null
    height: number | null
    durationMs: number | null
  }>
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

export function validateTikTokPublication(input: TikTokValidationInput) {
  const errors: string[] = []
  const warnings: string[] = []
  if (!['approved', 'scheduled'].includes(input.status))
    errors.push('La publication doit être approuvée.')
  if (input.approvedVersion !== input.contentVersion)
    errors.push('La version approuvée ne correspond plus au contenu courant.')
  if (!input.targetNetworks.includes('tiktok'))
    errors.push('TikTok ne fait pas partie des réseaux ciblés.')
  if (input.accountStatus !== 'connected') errors.push('Le compte TikTok doit être reconnecté.')
  if (input.accountExpiresAt && input.accountExpiresAt <= Date.now())
    errors.push('Le jeton TikTok est expiré.')
  if (!input.creator.privacyLevelOptions.includes(input.video.privacyLevel))
    errors.push('Ce niveau de confidentialité TikTok n’est pas disponible pour ce compte.')
  if (input.video.caption.length > 2200) errors.push('La légende TikTok dépasse 2 200 caractères.')
  if (input.creator.commentDisabled && !input.video.disableComment)
    errors.push('Les commentaires sont désactivés par le compte TikTok.')
  if (input.creator.duetDisabled && !input.video.disableDuet)
    errors.push('Les Duos sont désactivés par le compte TikTok.')
  if (input.creator.stitchDisabled && !input.video.disableStitch)
    errors.push('Les Collages sont désactivés par le compte TikTok.')
  const activeMedia = input.media.filter((media) => !media.deleted)
  if (activeMedia.length !== 1) errors.push('Une publication TikTok doit contenir une vidéo.')
  const media = activeMedia[0]
  if (media && media.scanStatus !== 'clean')
    errors.push('La vidéo doit être validée avant publication.')
  if (media && media.mimeType !== 'video/mp4')
    errors.push('Seules les vidéos MP4 sont prises en charge dans cette version.')
  if (media && media.sizeBytes > 4_000_000_000) errors.push('La vidéo TikTok dépasse 4 Go.')
  if (
    media?.durationMs &&
    media.durationMs > Math.min(600, input.creator.maxVideoPostDurationSec) * 1000
  )
    errors.push('La vidéo dépasse la durée maximale autorisée pour ce compte TikTok.')
  if (
    media?.width &&
    media.height &&
    (media.width < 360 || media.height < 360 || media.width > 4096 || media.height > 4096)
  )
    errors.push('La définition vidéo TikTok doit être comprise entre 360 et 4 096 pixels.')
  if (media && (!media.durationMs || !media.width || !media.height))
    warnings.push('Le codec, la fréquence, la durée et la définition seront vérifiés par TikTok.')
  return { valid: errors.length === 0, errors, warnings }
}

export function tiktokIdempotencyKey(input: {
  publicationId: string
  version: number
  accountId: string
}) {
  return createHash('sha256')
    .update(`${input.publicationId}:tiktok:${input.version}:${input.accountId}`)
    .digest('hex')
}

export function tiktokPayloadHash(input: {
  video: TikTokVideoPayload
  media: Array<{
    storageKey: string
    mimeType: string
    checksum: string
    position: number
    sizeBytes: number
  }>
}) {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

export function normalizeTikTokError(input: {
  name?: string
  httpStatus?: number
  code?: number | string
}): SocialPublishError {
  const code = String(input.code ?? input.name ?? 'unknown')
  if (input.name === 'AbortError' || input.name === 'TimeoutError')
    return { category: 'timeout', code, retryable: true }
  if (input.httpStatus === 429 || code === 'rate_limit_exceeded')
    return { category: 'rate_limit', code, retryable: true, httpStatus: input.httpStatus }
  if (
    (input.httpStatus && input.httpStatus >= 500) ||
    ['internal_error', 'internal', 'processing_pending'].includes(code)
  )
    return { category: 'server', code, retryable: true, httpStatus: input.httpStatus }
  if (input.httpStatus === 401 || code === 'access_token_invalid')
    return { category: 'token_expired', code, retryable: false, httpStatus: input.httpStatus }
  if (input.httpStatus === 403 || code === 'scope_not_authorized')
    return { category: 'permission', code, retryable: false, httpStatus: input.httpStatus }
  if (input.httpStatus === 400 || input.httpStatus === 422)
    return { category: 'invalid_content', code, retryable: false, httpStatus: input.httpStatus }
  return { category: 'unknown', code, retryable: false, httpStatus: input.httpStatus }
}
