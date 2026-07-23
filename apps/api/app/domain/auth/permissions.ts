import { isUserRole, type UserRole } from '#domain/auth/user_role'

export const PERMISSIONS = {
  usersRead: 'users.read',
  usersManage: 'users.manage',
  projectsRead: 'projects.read',
  projectsManage: 'projects.manage',
  projectsReview: 'projects.review',
  socialManage: 'social.manage',
  supervisionRead: 'supervision.read',
  statisticsRead: 'statistics.read',
  aiGenerate: 'ai.generate',
  translationsManage: 'translations.manage',
  calendarExport: 'calendar.export',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const PERMISSION_MATRIX: Readonly<Record<UserRole, readonly Permission[]>> = {
  admin: Object.values(PERMISSIONS),
  agency: [
    PERMISSIONS.projectsRead,
    PERMISSIONS.projectsManage,
    PERMISSIONS.projectsReview,
    PERMISSIONS.socialManage,
    PERMISSIONS.supervisionRead,
    PERMISSIONS.statisticsRead,
    PERMISSIONS.aiGenerate,
    PERMISSIONS.translationsManage,
    PERMISSIONS.calendarExport,
  ],
  client: [PERMISSIONS.projectsRead, PERMISSIONS.projectsReview],
}

export function hasPermission(role: string, permission: string): boolean {
  if (!isUserRole(role)) return false
  return PERMISSION_MATRIX[role].includes(permission as Permission)
}
