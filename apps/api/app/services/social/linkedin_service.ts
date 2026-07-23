import { validateLinkedInPublication } from '#domain/social/linkedin'
import PublicationAttempt from '#models/publication_attempt'
import type Publication from '#models/publication'
import type ScheduledPublication from '#models/scheduled_publication'
import type SocialAccount from '#models/social_account'
import db from '@adonisjs/lucid/services/db'

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
    createdAt: account.createdAt.toUTC().toISO()!,
    updatedAt: account.updatedAt.toUTC().toISO()!,
    revokedAt: account.revokedAt?.toUTC().toISO() ?? null,
  }
}

export function toAttemptView(attempt: PublicationAttempt) {
  return {
    id: attempt.id,
    attempt: attempt.attempt,
    startedAt: attempt.startedAt.toUTC().toISO()!,
    finishedAt: attempt.finishedAt?.toUTC().toISO() ?? null,
    result: attempt.result,
    normalizedError: attempt.normalizedError,
    remotePostId: attempt.remotePostId,
  }
}

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
    attempts: attempts.map(toAttemptView),
    createdAt: schedule.createdAt.toUTC().toISO()!,
    updatedAt: schedule.updatedAt.toUTC().toISO()!,
  }
}

export async function linkedinMediaForPublication(publicationId: string) {
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
      'pm.position'
    )
  return rows.map((row) => ({
    storageKey: row.storage_key as string,
    mimeType: row.mime_type as string,
    checksum: row.checksum as string,
    position: Number(row.position),
    scanStatus: row.scan_status as string,
    deleted: Boolean(row.deleted_at),
  }))
}

export async function validatePublicationForLinkedIn(
  publication: Publication,
  account: SocialAccount,
  effectiveText: string = publication.baseText
) {
  return validateLinkedInPublication({
    status: publication.status,
    contentVersion: publication.contentVersion,
    approvedVersion: publication.approvedVersion,
    targetNetworks: publication.targetNetworks,
    baseText: effectiveText,
    accountStatus: account.status,
    accountExpiresAt: account.expiresAt?.toMillis() ?? null,
    media: await linkedinMediaForPublication(publication.id),
  })
}
