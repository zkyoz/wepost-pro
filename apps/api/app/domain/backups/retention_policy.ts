export type BackupRetentionTier = 'daily' | 'weekly' | 'monthly'

export type StoredBackupObject = {
  key: string
  lastModified: Date
}

export function retentionTierFor(date: Date): BackupRetentionTier {
  if (date.getUTCDate() === 1) return 'monthly'
  if (date.getUTCDay() === 0) return 'weekly'
  return 'daily'
}

export function backupObjectKey(prefix: string, date: Date, tier: BackupRetentionTier, id: string) {
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '')
  const day = date.toISOString().slice(0, 10)
  return `${normalizedPrefix}/${tier}/${day}/${id}.dump.enc`
}

export function retentionTierFromKey(key: string): BackupRetentionTier | null {
  const match = key.match(/\/(daily|weekly|monthly)\//)
  return (match?.[1] as BackupRetentionTier | undefined) ?? null
}

export function expiredBackupObjects(objects: readonly StoredBackupObject[], now: Date) {
  return objects.filter((object) => {
    const tier = retentionTierFromKey(object.key)
    if (!tier) return false
    const cutoff = new Date(now)
    if (tier === 'monthly') cutoff.setUTCMonth(cutoff.getUTCMonth() - 12)
    else cutoff.setUTCDate(cutoff.getUTCDate() - (tier === 'weekly' ? 12 * 7 : 30))
    return object.lastModified < cutoff
  })
}
