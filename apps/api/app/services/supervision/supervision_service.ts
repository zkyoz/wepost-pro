import {
  SUPERVISION_CATEGORIES,
  actionRequiredCount,
  publicationStatusForCategory,
  type SupervisionCategory,
} from '#domain/supervision/supervision'
import Notification from '#models/notification'
import type User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import type { DatabaseQueryBuilderContract } from '@adonisjs/lucid/types/querybuilder'
import { DateTime } from 'luxon'

export type SupervisionFilters = {
  clientId?: string
  projectId?: string
  network?: string
  from: string | null
  to: string | null
  responsibleId?: string
}

function applyScope(
  query: DatabaseQueryBuilderContract,
  actor: User,
  filters: SupervisionFilters,
  dateExpression: string
) {
  if (actor.role !== 'admin') query.where('p.agency_id', actor.agencyId!)
  if (filters.clientId) query.where('pr.client_user_id', filters.clientId)
  if (filters.projectId) query.where('p.project_id', filters.projectId)
  if (filters.network) query.whereRaw('? = ANY(p.target_networks)', [filters.network])
  if (filters.responsibleId) query.where('p.created_by', filters.responsibleId)
  if (filters.from) query.whereRaw(`${dateExpression} >= ?`, [filters.from])
  if (filters.to) query.whereRaw(`${dateExpression} <= ?`, [filters.to])
  return query
}

function publicationsQuery(
  actor: User,
  filters: SupervisionFilters,
  category: SupervisionCategory
) {
  const query = db
    .from('publications as p')
    .innerJoin('projects as pr', 'pr.id', 'p.project_id')
    .innerJoin('users as client', 'client.id', 'pr.client_user_id')
    .innerJoin('users as responsible', 'responsible.id', 'p.created_by')
    .where('p.status', publicationStatusForCategory(category)!)
  return applyScope(query, actor, filters, 'COALESCE(p.scheduled_at, p.updated_at)')
}

function unreadCommentsQuery(actor: User, filters: SupervisionFilters) {
  const query = db
    .from('notifications as n')
    .joinRaw(
      `INNER JOIN publications AS p
       ON p.id = (n.payload_json->>'publicationId')::uuid`
    )
    .innerJoin('projects as pr', 'pr.id', 'p.project_id')
    .innerJoin('users as client', 'client.id', 'pr.client_user_id')
    .innerJoin('users as responsible', 'responsible.id', 'p.created_by')
    .where('n.user_id', actor.id)
    .where('n.type', 'publication.comment_created')
    .whereNull('n.read_at')
  return applyScope(query, actor, filters, 'n.created_at')
}

function categoryQuery(actor: User, filters: SupervisionFilters, category: SupervisionCategory) {
  return category === 'unread_comments'
    ? unreadCommentsQuery(actor, filters)
    : publicationsQuery(actor, filters, category)
}

async function countCategory(
  actor: User,
  filters: SupervisionFilters,
  category: SupervisionCategory
) {
  const rows = await categoryQuery(actor, filters, category).count('* as total')
  return Number(rows[0].total)
}

export async function supervisionFilterOptions(actor: User) {
  const projectsQuery = db
    .from('projects as pr')
    .innerJoin('users as client', 'client.id', 'pr.client_user_id')
    .select(
      'pr.id',
      'pr.name',
      'pr.client_user_id as clientId',
      'client.display_name as clientName'
    )
    .orderBy('pr.name')
  if (actor.role !== 'admin') projectsQuery.where('pr.agency_id', actor.agencyId!)
  const projects = await projectsQuery

  const responsibleQuery = db
    .from('publications as p')
    .innerJoin('users as responsible', 'responsible.id', 'p.created_by')
    .distinct('responsible.id', 'responsible.display_name as name')
    .orderBy('responsible.display_name')
  if (actor.role !== 'admin') responsibleQuery.where('p.agency_id', actor.agencyId!)
  const responsibles = await responsibleQuery

  const clients = [
    ...new Map(
      projects.map((project) => [
        project.clientId,
        { id: project.clientId, name: project.clientName },
      ])
    ).values(),
  ].sort((left, right) => left.name.localeCompare(right.name, 'fr'))

  return {
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      clientId: project.clientId,
    })),
    clients,
    responsibles,
  }
}

export async function supervisionSummary(actor: User, filters: SupervisionFilters) {
  const entries = await Promise.all(
    SUPERVISION_CATEGORIES.map(async (category) => [
      category,
      await countCategory(actor, filters, category),
    ])
  )
  const counts = Object.fromEntries(entries) as Record<SupervisionCategory, number>
  return {
    counts,
    actionRequired: actionRequiredCount(counts),
    generatedAt: DateTime.utc().toISO()!,
    filters: await supervisionFilterOptions(actor),
  }
}

export async function supervisionItems(
  actor: User,
  filters: SupervisionFilters,
  category: SupervisionCategory,
  page: number,
  perPage: number
) {
  const query = categoryQuery(actor, filters, category).select(
    'p.id',
    'p.title',
    'p.status',
    'p.target_networks as targetNetworks',
    'p.scheduled_at as scheduledAt',
    'p.updated_at as updatedAt',
    'pr.id as projectId',
    'pr.name as projectName',
    'client.id as clientId',
    'client.display_name as clientName',
    'responsible.id as responsibleId',
    'responsible.display_name as responsibleName'
  )
  if (category === 'unread_comments') {
    query
      .select('n.id as notificationId', 'n.created_at as activityAt')
      .orderBy('n.created_at', 'desc')
  } else {
    query
      .select(db.raw('NULL::uuid AS "notificationId"'))
      .select(db.raw('COALESCE(p.scheduled_at, p.updated_at) AS "activityAt"'))
      .orderByRaw('COALESCE(p.scheduled_at, p.updated_at) DESC')
  }
  const paginator = await query.orderBy('p.id').paginate(page, perPage)
  return {
    data: paginator.all().map((item) => ({
      ...item,
      scheduledAt: item.scheduledAt?.toISOString?.() ?? item.scheduledAt ?? null,
      updatedAt: item.updatedAt?.toISOString?.() ?? item.updatedAt,
      activityAt: item.activityAt?.toISOString?.() ?? item.activityAt,
    })),
    meta: paginator.getMeta(),
  }
}

export async function markSupervisionCommentRead(actor: User, id: string) {
  const notification = await Notification.query()
    .where('id', id)
    .where('userId', actor.id)
    .where('type', 'publication.comment_created')
    .first()
  if (!notification) return null
  notification.readAt = notification.readAt ?? DateTime.utc()
  await notification.save()
  return notification
}
