import {
  applyContentChange,
  assertCurrentVersion,
  canEditPublication,
  canTransition,
  PublicationVersionConflictError,
  transitionPublication,
} from '#domain/publications/publication_lifecycle'
import { test } from '@japa/runner'

test.group('Publication lifecycle', () => {
  test('accepts the documented workflow and rejects illegal jumps', ({ assert }) => {
    assert.isTrue(canTransition('draft', 'in_progress'))
    assert.isTrue(canTransition('awaiting_client_review', 'approved'))
    assert.isTrue(canTransition('approved', 'scheduled'))
    assert.isFalse(canTransition('draft', 'published'))
    assert.throws(
      () =>
        transitionPublication(
          { status: 'draft', contentVersion: 1, approvedVersion: null },
          'published'
        ),
      'Transition interdite'
    )
  })

  test('records the approved version and invalidates it after a content edit', ({ assert }) => {
    const approved = transitionPublication(
      { status: 'awaiting_client_review', contentVersion: 3, approvedVersion: null },
      'approved'
    )
    assert.deepEqual(approved, { status: 'approved', approvedVersion: 3 })
    assert.deepEqual(
      applyContentChange({ status: approved.status, contentVersion: 3, approvedVersion: 3 }),
      { status: 'in_progress', contentVersion: 4, approvedVersion: null }
    )
  })

  test('enforces optimistic versions and immutable terminal content', ({ assert }) => {
    assert.doesNotThrow(() => assertCurrentVersion(2, 2))
    assert.throws(() => assertCurrentVersion(1, 2), PublicationVersionConflictError)
    try {
      assertCurrentVersion(1, 2)
    } catch (error) {
      assert.instanceOf(error, PublicationVersionConflictError)
      assert.equal((error as PublicationVersionConflictError).currentVersion, 2)
    }
    assert.isFalse(canEditPublication('publishing'))
    assert.isFalse(canEditPublication('published'))
    assert.isFalse(canEditPublication('archived'))
    assert.isTrue(canEditPublication('approved'))
  })
})
