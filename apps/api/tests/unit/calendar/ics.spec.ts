import { escapeIcsText, foldIcsLine, serializeCalendar } from '#domain/calendar/ics'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { Buffer } from 'node:buffer'

const baseEvent = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Campagne été',
  projectName: 'Projet France',
  status: 'scheduled' as const,
  scheduledAt: DateTime.fromISO('2026-10-26T09:30', { zone: 'Europe/Paris' }),
  contentVersion: 4,
  createdAt: DateTime.fromISO('2026-07-01T08:00:00Z'),
  updatedAt: DateTime.fromISO('2026-07-23T09:00:00Z'),
}

test.group('iCalendar serialization', () => {
  test('uses stable identifiers, UTC dates, sequence and cancellation status', ({ assert }) => {
    const ics = serializeCalendar({
      name: 'Wepost.pro',
      events: [baseEvent, { ...baseEvent, status: 'archived', contentVersion: 5 }],
    })
    assert.include(ics, 'UID:publication-123e4567-e89b-12d3-a456-426614174000@wepost.pro')
    assert.include(ics, 'DTSTART:20261026T083000Z')
    assert.include(ics, 'SEQUENCE:4')
    assert.include(ics, 'STATUS:CONFIRMED')
    assert.include(ics, 'STATUS:CANCELLED')
    assert.isTrue(ics.endsWith('\r\n'))
  })

  test('escapes newlines and delimiters without allowing content-line injection', ({ assert }) => {
    const malicious = 'Titre\r\nBEGIN:VEVENT,;\\fin'
    assert.equal(escapeIcsText(malicious), 'Titre\\nBEGIN:VEVENT\\,\\;\\\\fin')
    const ics = serializeCalendar({
      name: 'Test',
      events: [{ ...baseEvent, title: malicious }],
    })
    assert.equal(ics.match(/^BEGIN:VEVENT$/gm)?.length, 1)
    assert.include(ics, 'SUMMARY:Titre\\nBEGIN:VEVENT\\,\\;\\\\fin')
  })

  test('folds UTF-8 content lines at no more than 75 octets', ({ assert }) => {
    const folded = foldIcsLine(`SUMMARY:${'Été responsable '.repeat(12)}`)
    for (const line of folded.split('\r\n')) {
      assert.isAtMost(Buffer.byteLength(line, 'utf8'), 75)
    }
  })
})
