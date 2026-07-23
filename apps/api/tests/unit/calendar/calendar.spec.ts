import {
  InvalidCalendarDateError,
  canMoveInCalendar,
  nextCalendarVersion,
  parseCalendarDate,
  parseCalendarRange,
} from '#domain/calendar/calendar'
import { test } from '@japa/runner'

test.group('Editorial calendar domain', () => {
  test('converts project local time to UTC across daylight saving changes', ({ assert }) => {
    assert.equal(
      parseCalendarDate('2026-03-28T09:00', 'Europe/Paris').toISO(),
      '2026-03-28T08:00:00.000Z'
    )
    assert.equal(
      parseCalendarDate('2026-03-30T09:00', 'Europe/Paris').toISO(),
      '2026-03-30T07:00:00.000Z'
    )
    assert.throws(
      () => parseCalendarDate('2026-03-29T02:30', 'Europe/Paris'),
      InvalidCalendarDateError
    )
  })

  test('validates ordered calendar ranges and their maximum volume', ({ assert }) => {
    const range = parseCalendarRange('2026-07-01T00:00', '2026-08-01T00:00', 'Europe/Paris')
    assert.equal(range.startUtc.toISO(), '2026-06-30T22:00:00.000Z')
    assert.throws(
      () => parseCalendarRange('2026-01-01T00:00', '2027-02-01T00:00', 'UTC'),
      InvalidCalendarDateError
    )
  })

  test('moves editable publications without changing status or approved version', ({ assert }) => {
    assert.deepEqual(
      nextCalendarVersion({ status: 'approved', contentVersion: 4, approvedVersion: 4 }),
      { status: 'approved', contentVersion: 5, approvedVersion: 4 }
    )
    assert.isTrue(canMoveInCalendar('draft'))
    assert.isFalse(canMoveInCalendar('published'))
    assert.throws(() =>
      nextCalendarVersion({ status: 'archived', contentVersion: 2, approvedVersion: null })
    )
  })
})
