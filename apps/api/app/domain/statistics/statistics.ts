import { DateTime } from 'luxon'

export class InvalidStatisticsPeriodError extends Error {}

export type StatisticsPeriod = {
  from: string
  to: string
  fromSql: string
  toSql: string
}

export function parseStatisticsPeriod(from: string, to: string): StatisticsPeriod {
  const start = DateTime.fromFormat(from, 'yyyy-MM-dd', { zone: 'utc' }).startOf('day')
  const end = DateTime.fromFormat(to, 'yyyy-MM-dd', { zone: 'utc' }).endOf('day')
  if (!start.isValid || !end.isValid || start.toISODate() !== from || end.toISODate() !== to) {
    throw new InvalidStatisticsPeriodError('La période statistique est invalide.')
  }
  if (start > end || end.diff(start, 'days').days > 366) {
    throw new InvalidStatisticsPeriodError('La période doit être ordonnée et limitée à 366 jours.')
  }
  return { from, to, fromSql: start.toSQL()!, toSql: end.toSQL()! }
}

export function successRate(published: number, failed: number): number | null {
  const terminal = published + failed
  return terminal === 0 ? null : Math.round((published / terminal) * 10_000) / 100
}

export function roundHours(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null
}

export type StatisticsCsvRow = {
  metric: string
  dimension: string
  label: string
  value: string | number
  unit: string
}

export function safeCsvCell(value: string | number): string {
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function statisticsCsv(rows: StatisticsCsvRow[]): string {
  const header = ['Indicateur', 'Dimension', 'Libellé', 'Valeur', 'Unité']
  return `\uFEFF${[header, ...rows.map((row) => Object.values(row))]
    .map((row) => row.map(safeCsvCell).join(','))
    .join('\r\n')}\r\n`
}
