import {
  canEditOwnComment,
  InvalidReviewStateError,
  reviewPublication,
  StaleReviewError,
} from '#domain/collaboration/review'
import { test } from '@japa/runner'

test.group('Client review domain', () => {
  test('approves exactly the current content version', ({ assert }) => {
    assert.deepEqual(
      reviewPublication(
        { status: 'awaiting_client_review', contentVersion: 4, approvedVersion: null },
        4,
        'approved'
      ),
      { status: 'approved', approvedVersion: 4 }
    )
  })

  test('requests corrections without approving a version', ({ assert }) => {
    assert.deepEqual(
      reviewPublication(
        { status: 'awaiting_client_review', contentVersion: 2, approvedVersion: null },
        2,
        'changes_requested'
      ),
      { status: 'changes_requested', approvedVersion: null }
    )
  })

  test('rejects stale versions and invalid workflow states', ({ assert }) => {
    assert.throws(
      () =>
        reviewPublication(
          { status: 'awaiting_client_review', contentVersion: 3, approvedVersion: null },
          2,
          'approved'
        ),
      StaleReviewError
    )
    assert.throws(
      () =>
        reviewPublication(
          { status: 'in_progress', contentVersion: 3, approvedVersion: null },
          3,
          'approved'
        ),
      InvalidReviewStateError
    )
  })

  test('limits comment editing to its author and configured window', ({ assert }) => {
    const now = Date.now()
    assert.isTrue(canEditOwnComment('user-1', 'user-1', now - 14 * 60_000, now, 15))
    assert.isFalse(canEditOwnComment('user-1', 'user-2', now, now, 15))
    assert.isFalse(canEditOwnComment('user-1', 'user-1', now - 16 * 60_000, now, 15))
  })
})
