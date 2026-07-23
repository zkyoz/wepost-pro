import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export type SocialAccountStatus = 'connected' | 'expired' | 'revoked' | 'error'

export default class SocialAccount extends BaseModel {
  static table = 'social_accounts'

  @column({ isPrimary: true }) declare id: string
  @column() declare agencyId: string
  @column() declare network: 'facebook' | 'instagram' | 'linkedin' | 'pinterest' | 'tiktok'
  @column() declare externalAccountId: string
  @column() declare externalAccountName: string
  @column({ serializeAs: null }) declare encryptedAccessToken: string | null
  @column({ serializeAs: null }) declare encryptedRefreshToken: string | null
  @column.dateTime() declare expiresAt: DateTime | null
  @column({ prepare: (value: string[]) => JSON.stringify(value) }) declare scopes: string[]
  @column() declare metadataJson: Record<string, unknown>
  @column() declare status: SocialAccountStatus
  @column() declare createdBy: string
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime
  @column.dateTime() declare revokedAt: DateTime | null
}
