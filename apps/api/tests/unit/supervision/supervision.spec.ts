import {
  InvalidSupervisionPeriodError,
  actionRequiredCount,
  parseSupervisionPeriod,
  publicationStatusForCategory,
} from '#domain/supervision/supervision'
import { test } from '@japa/runner'

test.group('Supervision definitions', () => {
  test('maps every publication category to its single source status', ({ assert }) => {
    assert.isNull(publicationStatusForCategory('unread_comments'))
    assert.equal(publicationStatusForCategory('awaiting_client_review'), 'awaiting_client_review')
    assert.equal(publicationStatusForCategory('changes_requested'), 'changes_requested')
    assert.equal(publicationStatusForCategory('scheduled'), 'scheduled')
    assert.equal(publicationStatusForCategory('published'), 'published')
    assert.equal(publicationStatusForCategory('failed'), 'failed')
  })

  test('counts only categories requiring an agency action', ({ assert }) => {
    assert.equal(
      actionRequiredCount({
        unread_comments: 2,
        awaiting_client_review: 3,
        changes_requested: 4,
        scheduled: 20,
        published: 30,
        failed: 5,
      }),
      14
    )
  })

  test('accepts an ordered bounded period and rejects invalid ranges', ({ assert }) => {
    assert.isNotNull(parseSupervisionPeriod('2026-07-01', '2026-07-31').from)
    assert.throws(
      () => parseSupervisionPeriod('2026-08-01', '2026-07-01'),
      InvalidSupervisionPeriodError
    )
    assert.throws(() => parseSupervisionPeriod('invalid', undefined), InvalidSupervisionPeriodError)
  })
})
