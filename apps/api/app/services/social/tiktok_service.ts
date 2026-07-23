import {
  validateTikTokPublication,
  type TikTokCreatorInfo,
  type TikTokVideoPayload,
} from '#domain/social/tiktok'
import PublicationAttempt from '#models/publication_attempt'
import type Publication from '#models/publication'
import type ScheduledPublication from '#models/scheduled_publication'
import type SocialAccount from '#models/social_account'
import db from '@adonisjs/lucid/services/db'

const defaultCreatorInfo: TikTokCreatorInfo = {
  privacyLevelOptions: [],
  commentDisabled: true,
  duetDisabled: true,
  stitchDisabled: true,
  maxVideoPostDurationSec: 0,
}

export function tiktokCreatorInfo(account: SocialAccount): TikTokCreatorInfo {
  const value = account.metadataJson.creatorInfo
  if (!value || typeof value !== 'object') return defaultCreatorInfo
  const info = value as Partial<TikTokCreatorInfo>
  return {
    privacyLevelOptions: Array.isArray(info.privacyLevelOptions)
      ? info.privacyLevelOptions.filter((item): item is string => typeof item === 'string')
      : [],
    commentDisabled: info.commentDisabled === true,
    duetDisabled: info.duetDisabled === true,
    stitchDisabled: info.stitchDisabled === true,
    maxVideoPostDurationSec:
      typeof info.maxVideoPostDurationSec === 'number' ? info.maxVideoPostDurationSec : 0,
  }
}

export function toSocialAccountView(account: SocialAccount) {
  return {
    id: account.id,
    agencyId: account.agencyId,
    network: account.network,
    externalAccountId: account.externalAccountId,
    externalAccountName: account.externalAccountName,
    expiresAt: account.expiresAt?.toUTC().toISO() ?? null,
    scopes: account.scopes,
    status: account.status,
    canRefresh: Boolean(account.encryptedRefreshToken),
    creatorInfo: tiktokCreatorInfo(account),
    createdAt: account.createdAt.toUTC().toISO()!,
    updatedAt: account.updatedAt.toUTC().toISO()!,
    revokedAt: account.revokedAt?.toUTC().toISO() ?? null,
  }
}
const toAttemptView = (attempt: PublicationAttempt) => ({
  id: attempt.id,
  attempt: attempt.attempt,
  startedAt: attempt.startedAt.toUTC().toISO()!,
  finishedAt: attempt.finishedAt?.toUTC().toISO() ?? null,
  result: attempt.result,
  normalizedError: attempt.normalizedError,
  remotePostId: attempt.remotePostId,
})
export async function toScheduleView(schedule: ScheduledPublication) {
  const attempts = await PublicationAttempt.query()
    .where('scheduledId', schedule.id)
    .orderBy('attempt', 'desc')
  return {
    id: schedule.id,
    publicationId: schedule.publicationId,
    network: schedule.network,
    accountId: schedule.accountId,
    publicationVersion: schedule.publicationVersion,
    runAt: schedule.runAt.toUTC().toISO()!,
    status: schedule.status,
    video: schedule.networkPayloadJson,
    providerJobId: schedule.providerJobId,
    providerStatus: schedule.providerStatus,
    attempts: attempts.map(toAttemptView),
    createdAt: schedule.createdAt.toUTC().toISO()!,
    updatedAt: schedule.updatedAt.toUTC().toISO()!,
  }
}
export async function tiktokMediaForPublication(publicationId: string) {
  const rows = await db
    .from('publication_media as pm')
    .innerJoin('media_assets as ma', 'ma.id', 'pm.media_id')
    .where('pm.publication_id', publicationId)
    .orderBy('pm.position')
    .select(
      'ma.storage_key',
      'ma.mime_type',
      'ma.checksum',
      'ma.scan_status',
      'ma.deleted_at',
      'ma.size_bytes',
      'ma.width',
      'ma.height',
      'ma.duration_ms',
      'pm.position'
    )
  return rows.map((row) => ({
    storageKey: row.storage_key as string,
    mimeType: row.mime_type as string,
    checksum: row.checksum as string,
    position: Number(row.position),
    scanStatus: row.scan_status as string,
    deleted: Boolean(row.deleted_at),
    sizeBytes: Number(row.size_bytes),
    width: row.width === null ? null : Number(row.width),
    height: row.height === null ? null : Number(row.height),
    durationMs: row.duration_ms === null ? null : Number(row.duration_ms),
  }))
}
export async function validatePublicationForTikTok(
  publication: Publication,
  account: SocialAccount,
  video: TikTokVideoPayload
) {
  return validateTikTokPublication({
    status: publication.status,
    contentVersion: publication.contentVersion,
    approvedVersion: publication.approvedVersion,
    targetNetworks: publication.targetNetworks,
    accountStatus: account.status,
    accountExpiresAt: account.expiresAt?.toMillis() ?? null,
    creator: tiktokCreatorInfo(account),
    video,
    media: await tiktokMediaForPublication(publication.id),
  })
}
