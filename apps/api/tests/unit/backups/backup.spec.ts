import {
  backupObjectKey,
  expiredBackupObjects,
  retentionTierFor,
} from '#domain/backups/retention_policy'
import {
  checksumFile,
  decryptBackupFile,
  encryptBackupFile,
  parseBackupEncryptionKey,
} from '#services/backups/backup_crypto'
import {
  redactBackupError,
  sendBackupStatus,
  validateRestoreDatabaseName,
} from '#services/backups/database_backup_service'
import { test } from '@japa/runner'
import { randomBytes } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test.group('Backup retention and integrity', () => {
  test('selects monthly, weekly and daily retention tiers', ({ assert }) => {
    assert.equal(retentionTierFor(new Date('2026-07-01T02:00:00Z')), 'monthly')
    assert.equal(retentionTierFor(new Date('2026-07-05T02:00:00Z')), 'weekly')
    assert.equal(retentionTierFor(new Date('2026-07-06T02:00:00Z')), 'daily')
    assert.equal(
      backupObjectKey(
        '/production/database/',
        new Date('2026-07-01T02:00:00Z'),
        'monthly',
        'run-id'
      ),
      'production/database/monthly/2026-07-01/run-id.dump.enc'
    )
  })

  test('purges only objects older than their retention window', ({ assert }) => {
    const now = new Date('2026-07-23T00:00:00Z')
    const expired = expiredBackupObjects(
      [
        {
          key: 'production/database/daily/2026-06-01/a.dump.enc',
          lastModified: new Date('2026-06-01T00:00:00Z'),
        },
        {
          key: 'production/database/weekly/2026-06-01/b.dump.enc',
          lastModified: new Date('2026-06-01T00:00:00Z'),
        },
        {
          key: 'production/database/monthly/2025-01-01/c.dump.enc',
          lastModified: new Date('2025-01-01T00:00:00Z'),
        },
        {
          key: 'media/unrelated.jpg',
          lastModified: new Date('2020-01-01T00:00:00Z'),
        },
      ],
      now
    )
    assert.deepEqual(
      expired.map((object) => object.key),
      [
        'production/database/daily/2026-06-01/a.dump.enc',
        'production/database/monthly/2025-01-01/c.dump.enc',
      ]
    )
  })

  test('encrypts, checksums and restores a simulated dump', async ({ assert }) => {
    const directory = await mkdtemp(join(tmpdir(), 'wepost-backup-test-'))
    const source = join(directory, 'source.dump')
    const encrypted = join(directory, 'source.dump.enc')
    const restored = join(directory, 'restored.dump')
    try {
      const key = randomBytes(32)
      await writeFile(source, Buffer.from('simulated PostgreSQL custom dump'))
      await encryptBackupFile(source, encrypted, key)
      const checksum = await checksumFile(encrypted)
      assert.match(checksum, /^[a-f0-9]{64}$/)
      assert.notDeepEqual(await readFile(encrypted), await readFile(source))
      await decryptBackupFile(encrypted, restored, key)
      assert.deepEqual(await readFile(restored), await readFile(source))
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  test('rejects invalid encryption keys and redacts unknown errors', ({ assert }) => {
    assert.throws(() => parseBackupEncryptionKey('not-a-key'), 'backup_encryption_key_invalid')
    assert.equal(redactBackupError(new Error('password=secret')), 'backup_operation_failed')
    assert.equal(redactBackupError(new Error('pg_dump_failed')), 'pg_dump_failed')
  })

  test('allows restore drills only on an explicitly isolated database', ({ assert }) => {
    assert.isTrue(validateRestoreDatabaseName('wepost_restore_test', 'wepost'))
    assert.isTrue(validateRestoreDatabaseName('wepost_drill', 'wepost'))
    assert.isFalse(validateRestoreDatabaseName('wepost', 'wepost'))
    assert.isFalse(validateRestoreDatabaseName('production_copy', 'wepost'))
    assert.isFalse(validateRestoreDatabaseName(undefined, 'wepost'))
  })

  test('signals a simulated backup failure without exposing the push URL', async ({ assert }) => {
    let receivedStatus = ''
    let receivedMessage = ''
    const fetcher = (async (input: string | URL | Request) => {
      const received = new URL(String(input))
      receivedStatus = received.searchParams.get('status') ?? ''
      receivedMessage = received.searchParams.get('msg') ?? ''
      return new Response(null, { status: 200 })
    }) as typeof fetch
    assert.isTrue(
      await sendBackupStatus(
        'down',
        'Échec de la sauvegarde PostgreSQL',
        fetcher,
        'https://uptime.example.test/push/private-token'
      )
    )
    assert.equal(receivedStatus, 'down')
    assert.equal(receivedMessage, 'Échec de la sauvegarde PostgreSQL')
  })
})
