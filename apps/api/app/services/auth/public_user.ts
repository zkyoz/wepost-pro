import type User from '#models/user'
import type { UserRole } from '#domain/auth/user_role'
import { DEFAULT_LOCALE, type AppLocale } from '#domain/i18n/locale'

export type PublicUser = {
  id: string
  agencyId: string | null
  email: string
  displayName: string
  role: UserRole
  locale: AppLocale
  isActive: boolean
  initials: string
  createdAt: string
  updatedAt: string
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    agencyId: user.agencyId,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    locale: user.locale ?? DEFAULT_LOCALE,
    isActive: user.isActive,
    initials: user.initials,
    createdAt: user.createdAt.toUTC().toISO()!,
    updatedAt: user.updatedAt.toUTC().toISO()!,
  }
}
