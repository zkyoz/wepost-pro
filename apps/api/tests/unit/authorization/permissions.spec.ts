import { PERMISSIONS, hasPermission, type Permission } from '#domain/auth/permissions'
import type { UserRole } from '#domain/auth/user_role'
import { test } from '@japa/runner'

const cases: Array<{ role: UserRole; permission: Permission; allowed: boolean }> = [
  { role: 'admin', permission: PERMISSIONS.usersManage, allowed: true },
  { role: 'admin', permission: PERMISSIONS.projectsManage, allowed: true },
  { role: 'agency', permission: PERMISSIONS.usersManage, allowed: false },
  { role: 'agency', permission: PERMISSIONS.projectsManage, allowed: true },
  { role: 'agency', permission: PERMISSIONS.socialManage, allowed: true },
  { role: 'agency', permission: PERMISSIONS.statisticsRead, allowed: true },
  { role: 'agency', permission: PERMISSIONS.aiGenerate, allowed: true },
  { role: 'client', permission: PERMISSIONS.projectsRead, allowed: true },
  { role: 'client', permission: PERMISSIONS.projectsReview, allowed: true },
  { role: 'client', permission: PERMISSIONS.projectsManage, allowed: false },
  { role: 'client', permission: PERMISSIONS.socialManage, allowed: false },
  { role: 'client', permission: PERMISSIONS.statisticsRead, allowed: false },
  { role: 'client', permission: PERMISSIONS.aiGenerate, allowed: false },
]

test.group('Permission matrix', () => {
  for (const { role, permission, allowed } of cases) {
    test(`${role} ${allowed ? 'may' : 'may not'} use ${permission}`, ({ assert }) => {
      assert.equal(hasPermission(role, permission), allowed)
    })
  }

  test('denies unknown roles and permissions by default', ({ assert }) => {
    assert.isFalse(hasPermission('unknown', PERMISSIONS.projectsRead))
    assert.isFalse(hasPermission('admin', 'unknown.permission'))
  })
})
