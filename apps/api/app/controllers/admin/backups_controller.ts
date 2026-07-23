import BackupRun from '#models/backup_run'
import { adminBackupsValidator } from '#validators/admin/backup_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

function view(run: BackupRun) {
  return {
    id: run.id,
    type: run.type,
    status: run.status,
    startedAt: run.startedAt.toUTC().toISO()!,
    completedAt: run.completedAt?.toUTC().toISO() ?? null,
    objectKey: run.objectKey,
    checksum: run.checksum,
    sizeBytes: run.sizeBytes === null ? null : Number(run.sizeBytes),
    errorCode: run.errorRedacted,
    retentionTier: run.retentionTier,
    verifiedAt: run.verifiedAt?.toUTC().toISO() ?? null,
    restoredAt: run.restoredAt?.toUTC().toISO() ?? null,
  }
}

export default class AdminBackupsController {
  async index({ request, response }: HttpContext) {
    const {
      page = 1,
      perPage = 20,
      status,
      type,
    } = await request.validateUsing(adminBackupsValidator)
    const query = BackupRun.query()
    if (status) query.where('status', status)
    if (type) query.where('type', type)
    const paginator = await query.orderBy('startedAt', 'desc').paginate(page, perPage)

    const [lastSuccessful, lastValid, lastRestore, totals] = await Promise.all([
      BackupRun.query()
        .where('type', 'database')
        .where('status', 'succeeded')
        .orderBy('startedAt', 'desc')
        .first(),
      BackupRun.query()
        .where('type', 'database')
        .where('status', 'succeeded')
        .whereNotNull('restoredAt')
        .orderBy('restoredAt', 'desc')
        .first(),
      BackupRun.query()
        .where('type', 'restore_drill')
        .where('status', 'succeeded')
        .orderBy('restoredAt', 'desc')
        .first(),
      db
        .from('backup_runs')
        .where('type', 'database')
        .select(
          db.raw('COUNT(*)::int AS total'),
          db.raw("COUNT(*) FILTER (WHERE status = 'succeeded')::int AS succeeded")
        )
        .first(),
    ])

    const lastSuccessfulAt = lastSuccessful?.completedAt?.toUTC() ?? null
    return response.ok({
      data: paginator.all().map(view),
      meta: paginator.getMeta(),
      summary: {
        lastVerifiedAt: lastSuccessfulAt?.toISO() ?? null,
        lastVerifiedAgeHours: lastSuccessfulAt
          ? Math.max(0, DateTime.utc().diff(lastSuccessfulAt, 'hours').hours)
          : null,
        lastValidAt: lastValid?.restoredAt?.toUTC().toISO() ?? null,
        lastRestoreAt: lastRestore?.restoredAt?.toUTC().toISO() ?? null,
        successRate:
          Number(totals?.total ?? 0) === 0
            ? null
            : Number(totals?.succeeded ?? 0) / Number(totals?.total),
      },
    })
  }
}
