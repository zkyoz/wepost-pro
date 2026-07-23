import {
  roundHours,
  statisticsCsv,
  successRate,
  type StatisticsCsvRow,
  type StatisticsPeriod,
} from '#domain/statistics/statistics'
import type User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import type { DatabaseQueryBuilderContract } from '@adonisjs/lucid/types/querybuilder'
import { DateTime } from 'luxon'

export type StatisticsFilters = {
  projectId?: string
  network?: string
}

function publicationScope(
  query: DatabaseQueryBuilderContract,
  actor: User,
  period: StatisticsPeriod,
  filters: StatisticsFilters
) {
  if (actor.role !== 'admin') query.where('p.agency_id', actor.agencyId!)
  query.whereBetween('p.created_at', [period.fromSql, period.toSql])
  if (filters.projectId) query.where('p.project_id', filters.projectId)
  if (filters.network) query.whereRaw('? = ANY(p.target_networks)', [filters.network])
  return query
}

function scheduleScope(
  query: DatabaseQueryBuilderContract,
  actor: User,
  period: StatisticsPeriod,
  filters: StatisticsFilters
) {
  if (actor.role !== 'admin') query.where('p.agency_id', actor.agencyId!)
  query.whereBetween('s.run_at', [period.fromSql, period.toSql])
  if (filters.projectId) query.where('p.project_id', filters.projectId)
  if (filters.network) query.where('s.network', filters.network)
  return query
}

export async function statisticsProjectOptions(actor: User) {
  const query = db.from('projects as pr').select('pr.id', 'pr.name').orderBy('pr.name')
  if (actor.role !== 'admin') query.where('pr.agency_id', actor.agencyId!)
  return query
}

export async function agencyStatistics(
  actor: User,
  period: StatisticsPeriod,
  filters: StatisticsFilters
) {
  const statusQuery = publicationScope(
    db.from('publications as p').select('p.status').count('* as count').groupBy('p.status'),
    actor,
    period,
    filters
  ).orderBy('p.status')

  const networkQuery = publicationScope(
    db
      .from('publications as p')
      .joinRaw('CROSS JOIN LATERAL unnest(p.target_networks) AS publication_network')
      .select(db.raw('publication_network AS network'))
      .count('* as count')
      .groupBy('publication_network'),
    actor,
    period,
    filters
  ).orderBy('publication_network')

  const projectQuery = publicationScope(
    db
      .from('publications as p')
      .innerJoin('projects as pr', 'pr.id', 'p.project_id')
      .select('pr.id', 'pr.name')
      .count('* as count')
      .groupBy('pr.id', 'pr.name'),
    actor,
    period,
    filters
  ).orderBy('pr.name')

  const terminalQuery = scheduleScope(
    db
      .from('scheduled_publications as s')
      .innerJoin('publications as p', 'p.id', 's.publication_id')
      .select('s.status')
      .count('* as count')
      .whereIn('s.status', ['published', 'failed'])
      .groupBy('s.status'),
    actor,
    period,
    filters
  )

  const approvalQuery = db
    .from('publication_reviews as rv')
    .innerJoin('publications as p', 'p.id', 'rv.publication_id')
    .where('rv.decision', 'approved')
    .whereBetween('rv.created_at', [period.fromSql, period.toSql])
    .select(
      db.raw(`AVG(EXTRACT(EPOCH FROM (rv.created_at - (
        SELECT MAX(al.created_at)
        FROM audit_logs al
        WHERE al.target_publication_id = p.id
          AND al.created_at <= rv.created_at
          AND al.next_values->>'status' = 'awaiting_client_review'
      ))) / 3600) AS hours`)
    )
  if (actor.role !== 'admin') approvalQuery.where('p.agency_id', actor.agencyId!)
  if (filters.projectId) approvalQuery.where('p.project_id', filters.projectId)
  if (filters.network) approvalQuery.whereRaw('? = ANY(p.target_networks)', [filters.network])

  const commentsQuery = db
    .from('comments as c')
    .innerJoin('publications as p', 'p.id', 'c.publication_id')
    .whereNull('c.deleted_at')
    .whereBetween('c.created_at', [period.fromSql, period.toSql])
    .count('* as count')
  if (actor.role !== 'admin') commentsQuery.where('p.agency_id', actor.agencyId!)
  if (filters.projectId) commentsQuery.where('p.project_id', filters.projectId)
  if (filters.network) commentsQuery.whereRaw('? = ANY(p.target_networks)', [filters.network])

  const correctionsQuery = db
    .from('publication_reviews as rv')
    .innerJoin('publications as p', 'p.id', 'rv.publication_id')
    .where('rv.decision', 'changes_requested')
    .whereBetween('rv.created_at', [period.fromSql, period.toSql])
    .count('* as count')
  if (actor.role !== 'admin') correctionsQuery.where('p.agency_id', actor.agencyId!)
  if (filters.projectId) correctionsQuery.where('p.project_id', filters.projectId)
  if (filters.network) correctionsQuery.whereRaw('? = ANY(p.target_networks)', [filters.network])

  const mediaQuery = db
    .from('media_assets as m')
    .select('m.id', 'm.size_bytes as sizeBytes')
    .distinct()
    .whereNull('m.deleted_at')
    .whereBetween('m.created_at', [period.fromSql, period.toSql])
  if (actor.role !== 'admin') mediaQuery.where('m.agency_id', actor.agencyId!)
  if (filters.projectId || filters.network) {
    mediaQuery
      .innerJoin('publication_media as pm', 'pm.media_id', 'm.id')
      .innerJoin('publications as p', 'p.id', 'pm.publication_id')
    if (filters.projectId) mediaQuery.where('p.project_id', filters.projectId)
    if (filters.network) mediaQuery.whereRaw('? = ANY(p.target_networks)', [filters.network])
  }

  const [
    byStatusRaw,
    byNetworkRaw,
    byProjectRaw,
    terminalRaw,
    approvalRaw,
    commentsRaw,
    correctionsRaw,
    media,
    projects,
  ] = await Promise.all([
    statusQuery,
    networkQuery,
    projectQuery,
    terminalQuery,
    approvalQuery,
    commentsQuery,
    correctionsQuery,
    mediaQuery,
    statisticsProjectOptions(actor),
  ])

  const byStatus = byStatusRaw.map((row) => ({ key: row.status, count: Number(row.count) }))
  const byNetwork = byNetworkRaw.map((row) => ({ key: row.network, count: Number(row.count) }))
  const byProject = byProjectRaw.map((row) => ({
    id: row.id,
    label: row.name,
    count: Number(row.count),
  }))
  const terminal = Object.fromEntries(terminalRaw.map((row) => [row.status, Number(row.count)]))
  const mediaBytes = media.reduce((total, row) => total + Number(row.sizeBytes), 0)

  return {
    period: { from: period.from, to: period.to, timezone: 'UTC' as const },
    filters: { projects, projectId: filters.projectId ?? null, network: filters.network ?? null },
    totals: {
      publications: byStatus.reduce((total, row) => total + row.count, 0),
      successRate: successRate(terminal.published ?? 0, terminal.failed ?? 0),
      meanApprovalHours: roundHours(approvalRaw[0]?.hours),
      comments: Number(commentsRaw[0]?.count ?? 0),
      corrections: Number(correctionsRaw[0]?.count ?? 0),
      mediaCount: media.length,
      mediaBytes,
    },
    byStatus,
    byNetwork,
    byProject,
    remote: {
      available: false,
      value: null,
      label: 'N/A',
      lastSyncedAt: null,
      reason: 'Aucun scope officiel d’analyse d’audience n’est configuré.',
    },
    generatedAt: DateTime.utc().toISO()!,
  }
}

export function statisticsToCsv(result: Awaited<ReturnType<typeof agencyStatistics>>) {
  const unavailable = 'N/A'
  const rows: StatisticsCsvRow[] = [
    {
      metric: 'Publications créées',
      dimension: 'total',
      label: 'Toutes',
      value: result.totals.publications,
      unit: 'publication',
    },
    {
      metric: 'Taux de succès',
      dimension: 'programmations terminées',
      label: 'Toutes',
      value: result.totals.successRate ?? unavailable,
      unit: '%',
    },
    {
      metric: 'Délai moyen d’approbation',
      dimension: 'approbations mesurables',
      label: 'Toutes',
      value: result.totals.meanApprovalHours ?? unavailable,
      unit: 'heure',
    },
    {
      metric: 'Commentaires',
      dimension: 'total',
      label: 'Toutes',
      value: result.totals.comments,
      unit: 'commentaire',
    },
    {
      metric: 'Corrections demandées',
      dimension: 'total',
      label: 'Toutes',
      value: result.totals.corrections,
      unit: 'décision',
    },
    {
      metric: 'Médias',
      dimension: 'nombre',
      label: 'Toutes',
      value: result.totals.mediaCount,
      unit: 'média',
    },
    {
      metric: 'Médias',
      dimension: 'volume',
      label: 'Toutes',
      value: result.totals.mediaBytes,
      unit: 'octet',
    },
    {
      metric: 'Audience externe',
      dimension: 'réseaux sociaux',
      label: result.remote.label,
      value: unavailable,
      unit: unavailable,
    },
    ...result.byStatus.map((row) => ({
      metric: 'Publications créées',
      dimension: 'statut',
      label: row.key,
      value: row.count,
      unit: 'publication',
    })),
    ...result.byNetwork.map((row) => ({
      metric: 'Publications créées',
      dimension: 'réseau',
      label: row.key,
      value: row.count,
      unit: 'publication',
    })),
    ...result.byProject.map((row) => ({
      metric: 'Publications créées',
      dimension: 'projet',
      label: row.label,
      value: row.count,
      unit: 'publication',
    })),
  ]
  return statisticsCsv(rows)
}
