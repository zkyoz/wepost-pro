import BackupRun from '#models/backup_run'
import User from '#models/user'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

async function actor(role: 'admin' | 'agency' | 'client', suffix: string) {
  return User.create({
    displayName: `${role} ${suffix}`,
    email: `${role}-${suffix}@backups.test`,
    password: 'correct-horse-battery-staple',
    role,
    agencyId: role === 'admin' ? null : '00000000-0000-4000-8000-000000000001',
    isActive: true,
  })
}

test.group('Admin backups', () => {
  test('returns the backup history and measured summary without secrets', async ({
    client,
    assert,
  }) => {
    const admin = await actor('admin', 'history')
    await BackupRun.create({
      type: 'database',
      status: 'succeeded',
      startedAt: DateTime.utc().minus({ minutes: 2 }),
      completedAt: DateTime.utc(),
      objectKey: 'test/database/daily/2026-07-23/run.dump.enc',
      checksum: 'a'.repeat(64),
      sizeBytes: 4096,
      errorRedacted: null,
      retentionTier: 'daily',
      verifiedAt: DateTime.utc(),
      restoredAt: null,
    })
    const response = await client.get('/api/v1/admin/backups').loginAs(admin)
    response.assertStatus(200)
    response.assertBodyContains({
      data: [{ type: 'database', status: 'succeeded', sizeBytes: 4096 }],
      summary: { successRate: 1 },
    })
    assert.notInclude(JSON.stringify(response.body()), 'BACKUP_ENCRYPTION_KEY')
    assert.notInclude(JSON.stringify(response.body()), 'BACKUP_R2_SECRET_ACCESS_KEY')
  })

  test('denies the backup history to every non-admin role', async ({ client }) => {
    const agency = await actor('agency', 'denied')
    const customer = await actor('client', 'denied')
    await client.get('/api/v1/admin/backups').then((response) => response.assertStatus(401))
    for (const user of [agency, customer]) {
      await client
        .get('/api/v1/admin/backups')
        .loginAs(user)
        .then((response) => response.assertStatus(403))
    }
  })
})
