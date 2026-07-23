import {
  backupObjectKey,
  expiredBackupObjects,
  retentionTierFor,
} from '#domain/backups/retention_policy'
import BackupRun from '#models/backup_run'
import env from '#start/env'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  checksumFile,
  decryptBackupFile,
  encryptBackupFile,
  parseBackupEncryptionKey,
} from './backup_crypto.js'
import { R2BackupStorage } from './backup_storage.js'

type CommandConnection = {
  host: string
  port: number
  user: string
  password: string
  database: string
}

function runPostgresTool(
  executable: 'pg_dump' | 'pg_restore',
  args: string[],
  connection: CommandConnection
) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, {
      env: { ...process.env, PGPASSWORD: connection.password },
      stdio: ['ignore', 'ignore', 'ignore'],
    })
    child.once('error', () => reject(new Error(`${executable}_unavailable`)))
    child.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${executable}_failed`))
    )
  })
}

export function redactBackupError(error: unknown) {
  const code = error instanceof Error ? error.message : 'unknown'
  const allowed = new Set([
    'backup_encryption_key_invalid',
    'backup_r2_configuration_missing',
    'backup_object_empty',
    'backup_object_integrity_failed',
    'backup_ciphertext_invalid',
    'backup_source_not_found',
    'restore_database_not_isolated',
    'pg_dump_unavailable',
    'pg_dump_failed',
    'pg_restore_unavailable',
    'pg_restore_failed',
  ])
  return allowed.has(code) ? code : 'backup_operation_failed'
}

export async function sendBackupStatus(
  status: 'up' | 'down',
  message: string,
  fetcher: typeof fetch = fetch,
  configuredUrl = env.get('UPTIME_KUMA_BACKUP_PUSH_URL')
) {
  if (!configuredUrl) return false
  try {
    const url = new URL(configuredUrl)
    url.searchParams.set('status', status)
    url.searchParams.set('msg', message)
    const response = await fetcher(url, { signal: AbortSignal.timeout(5_000) })
    return response.ok
  } catch {
    return false
  }
}

function applicationConnection(): CommandConnection {
  return {
    host: env.get('DB_HOST'),
    port: env.get('DB_PORT'),
    user: env.get('DB_USER'),
    password: env.get('DB_PASSWORD'),
    database: env.get('DB_DATABASE'),
  }
}

export function validateRestoreDatabaseName(database: string | undefined, current: string) {
  return Boolean(database && database !== current && /(_restore|_drill|_test)$/.test(database))
}

function restoreConnection(): CommandConnection {
  const database = env.get('RESTORE_DB_DATABASE')
  if (!database || !validateRestoreDatabaseName(database, env.get('DB_DATABASE'))) {
    throw new Error('restore_database_not_isolated')
  }
  return {
    host: env.get('RESTORE_DB_HOST') ?? env.get('DB_HOST'),
    port: env.get('RESTORE_DB_PORT') ?? env.get('DB_PORT'),
    user: env.get('RESTORE_DB_USER') ?? env.get('DB_USER'),
    password: env.get('RESTORE_DB_PASSWORD') ?? env.get('DB_PASSWORD'),
    database,
  }
}

export default class DatabaseBackupService {
  async backup(now = DateTime.utc()) {
    const run = await BackupRun.create({
      type: 'database',
      status: 'running',
      startedAt: now,
      completedAt: null,
      objectKey: null,
      checksum: null,
      sizeBytes: null,
      errorRedacted: null,
      retentionTier: null,
      verifiedAt: null,
      restoredAt: null,
    })
    const directory = await mkdtemp(join(tmpdir(), 'wepost-backup-'))
    const dumpPath = join(directory, 'database.dump')
    const encryptedPath = join(directory, 'database.dump.enc')

    try {
      const key = parseBackupEncryptionKey(env.get('BACKUP_ENCRYPTION_KEY') ?? '')
      const storage = new R2BackupStorage()
      const tier = retentionTierFor(now.toJSDate())
      const objectKey = backupObjectKey(storage.prefix, now.toJSDate(), tier, randomUUID())

      const connection = applicationConnection()
      await runPostgresTool(
        'pg_dump',
        [
          '--format=custom',
          '--no-owner',
          '--no-privileges',
          '--host',
          connection.host,
          '--port',
          String(connection.port),
          '--username',
          connection.user,
          '--file',
          dumpPath,
          connection.database,
        ],
        connection
      )
      await encryptBackupFile(dumpPath, encryptedPath, key)
      const checksum = await checksumFile(encryptedPath)
      const encryptedFile = await stat(encryptedPath)
      const sizeBytes = encryptedFile.size
      await storage.upload(encryptedPath, objectKey, checksum)
      if (!(await storage.verify(objectKey, checksum, sizeBytes))) {
        throw new Error('backup_object_integrity_failed')
      }

      run.merge({
        status: 'succeeded',
        completedAt: DateTime.utc(),
        objectKey,
        checksum,
        sizeBytes,
        retentionTier: tier,
        verifiedAt: DateTime.utc(),
      })
      await run.save()

      for (const object of expiredBackupObjects(await storage.list(), now.toJSDate())) {
        await storage.delete(object.key)
      }
      await sendBackupStatus('up', 'Sauvegarde PostgreSQL vérifiée')
      return run
    } catch (error) {
      run.merge({
        status: 'failed',
        completedAt: DateTime.utc(),
        errorRedacted: redactBackupError(error),
      })
      await run.save()
      await sendBackupStatus('down', 'Échec de la sauvegarde PostgreSQL')
      throw new Error(run.errorRedacted ?? 'backup_operation_failed')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }

  async restoreDrill(objectKey?: string) {
    const source = objectKey
      ? await BackupRun.query()
          .where('type', 'database')
          .where('status', 'succeeded')
          .where('objectKey', objectKey)
          .first()
      : await BackupRun.query()
          .where('type', 'database')
          .where('status', 'succeeded')
          .whereNotNull('verifiedAt')
          .orderBy('startedAt', 'desc')
          .first()
    if (!source?.objectKey || !source.checksum) throw new Error('backup_source_not_found')

    const startedAt = DateTime.utc()
    const run = await BackupRun.create({
      type: 'restore_drill',
      status: 'running',
      startedAt,
      completedAt: null,
      objectKey: source.objectKey,
      checksum: source.checksum,
      sizeBytes: source.sizeBytes,
      errorRedacted: null,
      retentionTier: source.retentionTier,
      verifiedAt: null,
      restoredAt: null,
    })
    const directory = await mkdtemp(join(tmpdir(), 'wepost-restore-'))
    const encryptedPath = join(directory, 'database.dump.enc')
    const dumpPath = join(directory, 'database.dump')

    try {
      const key = parseBackupEncryptionKey(env.get('BACKUP_ENCRYPTION_KEY') ?? '')
      const storage = new R2BackupStorage()
      const connection = restoreConnection()
      await storage.download(source.objectKey, encryptedPath)
      if ((await checksumFile(encryptedPath)) !== source.checksum) {
        throw new Error('backup_object_integrity_failed')
      }
      await decryptBackupFile(encryptedPath, dumpPath, key)
      await runPostgresTool(
        'pg_restore',
        [
          '--exit-on-error',
          '--clean',
          '--if-exists',
          '--no-owner',
          '--no-privileges',
          '--host',
          connection.host,
          '--port',
          String(connection.port),
          '--username',
          connection.user,
          '--dbname',
          connection.database,
          dumpPath,
        ],
        connection
      )
      run.merge({
        status: 'succeeded',
        completedAt: DateTime.utc(),
        verifiedAt: DateTime.utc(),
        restoredAt: DateTime.utc(),
      })
      source.restoredAt = run.restoredAt
      await Promise.all([run.save(), source.save()])
      return run
    } catch (error) {
      run.merge({
        status: 'failed',
        completedAt: DateTime.utc(),
        errorRedacted: redactBackupError(error),
      })
      await run.save()
      throw new Error(run.errorRedacted ?? 'backup_operation_failed')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }
}
