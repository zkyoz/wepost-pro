import { UserSchema } from '#database/schema'
import type { UserRole } from '#domain/auth/user_role'
import type { AppLocale } from '#domain/i18n/locale'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'

export default class User extends compose(
  UserSchema,
  withAuthFinder(hash, { uids: ['email'], passwordColumnName: 'password' })
) {
  declare role: UserRole
  declare locale: AppLocale

  get initials() {
    const [first, last] = this.displayName.split(' ')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
