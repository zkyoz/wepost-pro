import {
  InvalidStatisticsPeriodError,
  parseStatisticsPeriod,
  safeCsvCell,
  statisticsCsv,
  successRate,
} from '#domain/statistics/statistics'
import { test } from '@japa/runner'

test.group('Statistics domain', () => {
  test('validates and bounds UTC periods', ({ assert }) => {
    const period = parseStatisticsPeriod('2026-07-01', '2026-07-31')
    assert.equal(period.from, '2026-07-01')
    assert.include(period.fromSql, '2026-07-01')
    assert.throws(
      () => parseStatisticsPeriod('2026-07-31', '2026-07-01'),
      InvalidStatisticsPeriodError
    )
    assert.throws(
      () => parseStatisticsPeriod('2025-01-01', '2026-07-31'),
      InvalidStatisticsPeriodError
    )
  })

  test('calculates the terminal publication success rate', ({ assert }) => {
    assert.equal(successRate(3, 1), 75)
    assert.equal(successRate(1, 2), 33.33)
    assert.isNull(successRate(0, 0))
  })

  test('neutralizes spreadsheet formulas in every CSV field', ({ assert }) => {
    assert.equal(
      safeCsvCell('=HYPERLINK("https://evil.test")'),
      '"\'=HYPERLINK(""https://evil.test"")"'
    )
    assert.include(
      statisticsCsv([{ metric: '+SUM(A1)', dimension: 'x', label: '@test', value: -2, unit: 'u' }]),
      "'+SUM(A1)"
    )
  })
})
