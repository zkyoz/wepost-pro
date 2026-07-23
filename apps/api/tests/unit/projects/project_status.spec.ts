import {
  archiveProject,
  canAcceptPublications,
  restoreProject,
} from '#domain/projects/project_status'
import { isValidTimezone } from '#services/projects/project_service'
import { test } from '@japa/runner'

test.group('Project domain', () => {
  test('only active projects accept new publications', ({ assert }) => {
    assert.isTrue(canAcceptPublications('active'))
    assert.isFalse(canAcceptPublications('archived'))
  })

  test('archive and restore transitions are idempotent', ({ assert }) => {
    assert.deepEqual(archiveProject('active'), { status: 'archived', changed: true })
    assert.deepEqual(archiveProject('archived'), { status: 'archived', changed: false })
    assert.deepEqual(restoreProject('archived'), { status: 'active', changed: true })
    assert.deepEqual(restoreProject('active'), { status: 'active', changed: false })
  })

  test('validates IANA timezones', ({ assert }) => {
    assert.isTrue(isValidTimezone('Europe/Paris'))
    assert.isTrue(isValidTimezone('UTC'))
    assert.isFalse(isValidTimezone('Mars/Olympus'))
  })
})
