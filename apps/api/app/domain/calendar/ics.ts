import type { PublicationStatus } from '#domain/publications/publication_lifecycle'
import type { DateTime } from 'luxon'
import { Buffer } from 'node:buffer'

export type IcsEvent = {
  id: string
  title: string
  projectName: string
  status: PublicationStatus
  scheduledAt: DateTime
  contentVersion: number
  createdAt: DateTime
  updatedAt: DateTime
}

const STATUS_LABELS: Record<PublicationStatus, string> = {
  draft: 'Brouillon',
  in_progress: 'En cours',
  awaiting_client_review: 'En attente de validation client',
  changes_requested: 'Corrections demandées',
  approved: 'Approuvée',
  scheduled: 'Programmée',
  publishing: 'Publication en cours',
  published: 'Publiée',
  failed: 'Échec de publication',
  archived: 'Archivée',
}

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

export function foldIcsLine(line: string): string {
  const chunks: string[] = []
  let current = ''
  let limit = 75
  for (const character of line) {
    if (current && Buffer.byteLength(current + character, 'utf8') > limit) {
      chunks.push(current)
      current = character
      limit = 74
    } else {
      current += character
    }
  }
  chunks.push(current)
  return chunks.join('\r\n ')
}

function utc(value: DateTime) {
  return value.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")
}

function icsStatus(status: PublicationStatus) {
  if (status === 'archived') return 'CANCELLED'
  if (['approved', 'scheduled', 'publishing', 'published'].includes(status)) return 'CONFIRMED'
  return 'TENTATIVE'
}

export function serializeCalendar(input: { name: string; events: readonly IcsEvent[] }): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Wepost.pro//Calendrier editorial//FR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(input.name)}`,
    'X-WR-TIMEZONE:UTC',
  ]

  for (const event of input.events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:publication-${event.id}@wepost.pro`,
      `DTSTAMP:${utc(event.updatedAt)}`,
      `DTSTART:${utc(event.scheduledAt)}`,
      `CREATED:${utc(event.createdAt)}`,
      `LAST-MODIFIED:${utc(event.updatedAt)}`,
      `SEQUENCE:${event.contentVersion}`,
      `STATUS:${icsStatus(event.status)}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      `DESCRIPTION:${escapeIcsText(`Projet : ${event.projectName}\nStatut : ${STATUS_LABELS[event.status]}`)}`,
      `CATEGORIES:${escapeIcsText(STATUS_LABELS[event.status])}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    )
  }
  lines.push('END:VCALENDAR')
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`
}
