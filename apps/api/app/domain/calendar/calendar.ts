import type { PublicationStatus } from '#domain/publications/publication_lifecycle'
import { DateTime } from 'luxon'

export const MAX_CALENDAR_RANGE_DAYS = 366

export class InvalidCalendarDateError extends Error {}

function isOffsetDate(value: string) {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
}

export function parseCalendarDate(value: string, timezone: string) {
  const date = DateTime.fromISO(value, { zone: timezone, setZone: true })
  if (!date.isValid) throw new InvalidCalendarDateError('La date est invalide.')

  if (!isOffsetDate(value)) {
    const requested = value.slice(0, 16)
    if (date.toFormat("yyyy-MM-dd'T'HH:mm") !== requested) {
      throw new InvalidCalendarDateError(
        'Cette heure locale n’existe pas lors du changement d’heure.'
      )
    }
  }
  return date.toUTC()
}

export function parseCalendarRange(start: string, end: string, timezone: string) {
  const startUtc = parseCalendarDate(start, timezone)
  const endUtc = parseCalendarDate(end, timezone)
  const days = endUtc.diff(startUtc, 'days').days
  if (days <= 0 || days > MAX_CALENDAR_RANGE_DAYS) {
    throw new InvalidCalendarDateError(
      `La plage doit être comprise entre 1 heure et ${MAX_CALENDAR_RANGE_DAYS} jours.`
    )
  }
  return { startUtc, endUtc }
}

export function canMoveInCalendar(status: PublicationStatus) {
  return !['publishing', 'published', 'archived'].includes(status)
}

export function nextCalendarVersion(current: {
  status: PublicationStatus
  contentVersion: number
  approvedVersion: number | null
}) {
  if (!canMoveInCalendar(current.status)) {
    throw new Error('Cette publication ne peut plus être déplacée.')
  }
  return {
    status: current.status,
    contentVersion: current.contentVersion + 1,
    approvedVersion: current.approvedVersion,
  }
}
