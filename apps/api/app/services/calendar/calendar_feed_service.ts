import { serializeCalendar, type IcsEvent } from '#domain/calendar/ics'
import { hasPermission, PERMISSIONS } from '#domain/auth/permissions'
import AuditLog from '#models/audit_log'
import CalendarFeedToken from '#models/calendar_feed_token'
import Publication from '#models/publication'
import User from '#models/user'
import { findAccessibleProject, scopedProjectQuery } from '#services/projects/project_service'
import { DateTime } from 'luxon'
import { createHash, randomBytes } from 'node:crypto'

export type ReturnTypeOfParseCalendarRange = {
  startUtc: DateTime
  endUtc: DateTime
}

export type CalendarFeedView = {
  id: string
  projectId: string | null
  projectName: string | null
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

let feedAccessTotal = 0

export function calendarFeedAccessTotal() {
  return feedAccessTotal
}

export function hashCalendarFeedToken(token: string) {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

function newCalendarFeedToken() {
  return randomBytes(48).toString('base64url')
}

async function accessibleProjects(actor: User, projectId?: string | null) {
  if (projectId) {
    const project = await findAccessibleProject(actor, projectId)
    return project ? [project] : null
  }
  return scopedProjectQuery(actor).orderBy('name')
}

async function buildIcs(
  actor: User,
  input: { projectId?: string | null; range?: ReturnTypeOfParseCalendarRange }
) {
  const projects = await accessibleProjects(actor, input.projectId)
  if (!projects) return null
  const projectIds = projects.map((project) => project.id)
  const query = Publication.query()
    .whereIn('projectId', projectIds)
    .whereNotNull('scheduledAt')
    .orderBy('scheduledAt')
    .orderBy('title')
  if (input.range) {
    query
      .where('scheduledAt', '>=', input.range.startUtc.toSQL()!)
      .where('scheduledAt', '<', input.range.endUtc.toSQL()!)
  }
  const publications = projectIds.length ? await query : []
  const projectsById = new Map(projects.map((project) => [project.id, project]))
  const events: IcsEvent[] = publications.flatMap((publication) => {
    const project = projectsById.get(publication.projectId)
    if (!project || !publication.scheduledAt) return []
    return [
      {
        id: publication.id,
        title: publication.title,
        projectName: project.name,
        status: publication.status,
        scheduledAt: publication.scheduledAt,
        contentVersion: publication.contentVersion,
        createdAt: publication.createdAt,
        updatedAt: publication.updatedAt,
      },
    ]
  })
  const name = input.projectId ? `Wepost.pro — ${projects[0]!.name}` : 'Wepost.pro — Agence'
  return { ics: serializeCalendar({ name, events }), eventCount: events.length, name }
}

export async function exportCalendarIcs(
  actor: User,
  input: { projectId?: string; range: ReturnTypeOfParseCalendarRange }
) {
  return buildIcs(actor, input)
}

export async function listCalendarFeeds(actor: User): Promise<CalendarFeedView[]> {
  const feeds = await CalendarFeedToken.query()
    .where('userId', actor.id)
    .orderBy('createdAt', 'desc')
  const projectIds = feeds.flatMap((feed) => (feed.projectId ? [feed.projectId] : []))
  const projects = projectIds.length
    ? await scopedProjectQuery(actor).whereIn('id', [...new Set(projectIds)])
    : []
  const projectsById = new Map(projects.map((project) => [project.id, project]))
  return feeds.map((feed) => ({
    id: feed.id,
    projectId: feed.projectId,
    projectName: feed.projectId ? (projectsById.get(feed.projectId)?.name ?? null) : null,
    createdAt: feed.createdAt.toUTC().toISO()!,
    lastUsedAt: feed.lastUsedAt?.toUTC().toISO() ?? null,
    revokedAt: feed.revokedAt?.toUTC().toISO() ?? null,
  }))
}

export async function createCalendarFeed(actor: User, projectId?: string | null) {
  const projects = await accessibleProjects(actor, projectId)
  if (!projects) return null
  const token = newCalendarFeedToken()
  const feed = await CalendarFeedToken.create({
    userId: actor.id,
    projectId: projectId ?? null,
    tokenHash: hashCalendarFeedToken(token),
    createdAt: DateTime.utc(),
    lastUsedAt: null,
    revokedAt: null,
  })
  await AuditLog.create({
    actorUserId: actor.id,
    targetProjectId: projectId ?? null,
    entityType: 'calendar_feed_token',
    entityId: feed.id,
    action: 'calendar.feed_created',
    previousValues: {},
    nextValues: { projectId: projectId ?? null },
  })
  const feeds = await listCalendarFeeds(actor)
  return { data: feeds.find((item) => item.id === feed.id)!, token }
}

export async function revokeCalendarFeed(actor: User, id: string) {
  const feed = await CalendarFeedToken.query()
    .where('id', id)
    .where('userId', actor.id)
    .whereNull('revokedAt')
    .first()
  if (!feed) return null
  feed.revokedAt = DateTime.utc()
  await feed.save()
  await AuditLog.create({
    actorUserId: actor.id,
    targetProjectId: feed.projectId,
    entityType: 'calendar_feed_token',
    entityId: feed.id,
    action: 'calendar.feed_revoked',
    previousValues: { revokedAt: null },
    nextValues: { revokedAt: feed.revokedAt.toISO() },
  })
  return feed
}

export async function resolveCalendarFeed(token: string) {
  const feed = await CalendarFeedToken.query()
    .where('tokenHash', hashCalendarFeedToken(token))
    .whereNull('revokedAt')
    .first()
  if (!feed) return null
  const actor = await User.find(feed.userId)
  if (!actor?.isActive || !hasPermission(actor.role, PERMISSIONS.calendarExport)) return null
  const calendar = await buildIcs(actor, { projectId: feed.projectId })
  if (!calendar) return null
  feed.lastUsedAt = DateTime.utc()
  await feed.save()
  feedAccessTotal += 1
  return { ...calendar, feedId: feed.id, actorId: actor.id }
}
