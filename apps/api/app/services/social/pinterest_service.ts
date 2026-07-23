import { validatePinterestPublication, type PinterestPinPayload } from '#domain/social/pinterest'
import PublicationAttempt from '#models/publication_attempt'
import type Publication from '#models/publication'
import type ScheduledPublication from '#models/scheduled_publication'
import type SocialAccount from '#models/social_account'
import db from '@adonisjs/lucid/services/db'

type Board = { id: string; name: string; privacy: string }
export function pinterestBoards(account: SocialAccount): Board[] {
  const boards = account.metadataJson.boards
  if (!Array.isArray(boards)) return []
  return boards.filter((board): board is Board =>
    Boolean(board && typeof board === 'object' && 'id' in board && 'name' in board)
  )
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
    boards: pinterestBoards(account),
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
    pin: schedule.networkPayloadJson,
    attempts: attempts.map(toAttemptView),
    createdAt: schedule.createdAt.toUTC().toISO()!,
    updatedAt: schedule.updatedAt.toUTC().toISO()!,
  }
}
export async function pinterestMediaForPublication(publicationId: string) {
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
export async function validatePublicationForPinterest(
  publication: Publication,
  account: SocialAccount,
  pin: PinterestPinPayload
) {
  return validatePinterestPublication({
    status: publication.status,
    contentVersion: publication.contentVersion,
    approvedVersion: publication.approvedVersion,
    targetNetworks: publication.targetNetworks,
    accountStatus: account.status,
    accountExpiresAt: account.expiresAt?.toMillis() ?? null,
    boardExists: pinterestBoards(account).some((board) => board.id === pin.boardId),
    pin,
    media: await pinterestMediaForPublication(publication.id),
  })
}
