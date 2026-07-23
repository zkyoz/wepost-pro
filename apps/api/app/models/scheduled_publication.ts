import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export type ScheduledPublicationStatus =
  'queued' | 'publishing' | 'published' | 'failed' | 'cancelled'

export default class ScheduledPublication extends BaseModel {
  static table = 'scheduled_publications'

  @column({ isPrimary: true }) declare id: string
  @column() declare publicationId: string
  @column() declare network: 'facebook' | 'instagram' | 'linkedin' | 'pinterest' | 'tiktok'
  @column() declare accountId: string
  @column() declare publicationVersion: number
  @column.dateTime() declare runAt: DateTime
  @column() declare status: ScheduledPublicationStatus
  @column() declare idempotencyKey: string
  @column() declare payloadHash: string
  @column() declare networkPayloadJson: Record<string, unknown>
  @column() declare providerJobId: string | null
  @column() declare providerStatus: string | null
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime
}
