import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export type PublicationAttemptResult =
  'started' | 'success' | 'transient_failure' | 'permanent_failure' | 'skipped'

export default class PublicationAttempt extends BaseModel {
  static table = 'publication_attempts'

  @column({ isPrimary: true }) declare id: string
  @column() declare scheduledId: string
  @column() declare attempt: number
  @column.dateTime() declare startedAt: DateTime
  @column.dateTime() declare finishedAt: DateTime | null
  @column() declare result: PublicationAttemptResult
  @column() declare normalizedError: Record<string, unknown> | null
  @column() declare remotePostId: string | null
}
