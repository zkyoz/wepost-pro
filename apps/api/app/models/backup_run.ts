import { BackupRunSchema } from '#database/schema'
import type { BackupRetentionTier } from '#domain/backups/retention_policy'

export type BackupRunType = 'database' | 'restore_drill'
export type BackupRunStatus = 'running' | 'succeeded' | 'failed'

export default class BackupRun extends BackupRunSchema {
  declare type: BackupRunType
  declare status: BackupRunStatus
  declare retentionTier: BackupRetentionTier | null
}
