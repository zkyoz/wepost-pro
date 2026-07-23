import MediaAsset from '#models/media_asset'
import PublicationMedia from '#models/publication_media'
import type User from '#models/user'
import { findAccessiblePublication } from '#services/publications/publication_service'
import { getMediaStorage } from '#services/media/media_storage'
import db from '@adonisjs/lucid/services/db'
import type { DateTime } from 'luxon'

export type MediaView = {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  checksum: string
  width: number | null
  height: number | null
  durationMs: number | null
  altText: string | null
  isDecorative: boolean
  scanStatus: MediaAsset['scanStatus']
  position?: number
  readUrl?: string
  createdAt: string
  deletedAt: string | null
}

export function toMediaView(media: MediaAsset, extra: Partial<MediaView> = {}): MediaView {
  return {
    id: media.id,
    originalName: media.originalName,
    mimeType: media.mimeType,
    sizeBytes: Number(media.sizeBytes),
    checksum: media.checksum,
    width: media.width,
    height: media.height,
    durationMs: media.durationMs === null ? null : Number(media.durationMs),
    altText: media.altText,
    isDecorative: media.isDecorative,
    scanStatus: media.scanStatus,
    createdAt: media.createdAt.toUTC().toISO()!,
    deletedAt: media.deletedAt?.toUTC().toISO() ?? null,
    ...extra,
  }
}

export async function findManageableMedia(actor: User, id: string) {
  if (actor.role === 'client') return null
  const query = MediaAsset.query().where('id', id)
  if (actor.role === 'agency') {
    if (!actor.agencyId) return null
    query.where('agencyId', actor.agencyId)
  }
  return query.first()
}

export async function findReadableMedia(actor: User, id: string) {
  const media = await MediaAsset.query().where('id', id).whereNull('deletedAt').first()
  if (!media) return null
  if (actor.role === 'admin') return media
  if (actor.role === 'agency' && actor.agencyId === media.agencyId) return media
  const links = await PublicationMedia.query().where('mediaId', id)
  for (const link of links) {
    if (await findAccessiblePublication(actor, link.publicationId)) return media
  }
  return null
}

export async function listPublicationMedia(actor: User, publicationId: string) {
  const publication = await findAccessiblePublication(actor, publicationId)
  if (!publication) return null
  const links = await PublicationMedia.query()
    .where('publicationId', publication.id)
    .orderBy('position')
  const ids = links.map((link) => link.mediaId)
  const media = ids.length
    ? await MediaAsset.query()
        .whereIn('id', ids)
        .whereNull('deletedAt')
        .where('scanStatus', 'clean')
    : []
  const byId = new Map(media.map((asset) => [asset.id, asset]))
  const storage = getMediaStorage()
  const data = await Promise.all(
    links.flatMap((link) => {
      const asset = byId.get(link.mediaId)
      if (!asset) return []
      return [
        storage.signRead(asset.storageKey).then((signed) =>
          toMediaView(asset, {
            position: link.position,
            readUrl: signed.url,
          })
        ),
      ]
    })
  )
  return { publication, data }
}

export async function compactMediaPositions(publicationId: string) {
  const links = await PublicationMedia.query()
    .where('publicationId', publicationId)
    .orderBy('position')
  await db.transaction(async (trx) => {
    for (const [index, link] of links.entries()) {
      await trx
        .from('publication_media')
        .where('publication_id', publicationId)
        .where('media_id', link.mediaId)
        .update({ position: links.length + index })
    }
    for (const [index, link] of links.entries()) {
      await trx
        .from('publication_media')
        .where('publication_id', publicationId)
        .where('media_id', link.mediaId)
        .update({ position: index })
    }
  })
}

export async function cleanupAbandonedUploads(input: { before: DateTime; agencyId?: string }) {
  const query = MediaAsset.query()
    .where('scanStatus', 'pending_upload')
    .where('uploadExpiresAt', '<=', input.before.toSQL()!)
  if (input.agencyId) query.where('agencyId', input.agencyId)
  const abandoned = await query
  const storage = getMediaStorage()
  for (const media of abandoned) {
    await storage.delete(media.storageKey)
    await media.delete()
  }
  return abandoned.length
}
