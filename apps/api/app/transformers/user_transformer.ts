import type User from '#models/user'
import { toPublicUser } from '#services/auth/public_user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return toPublicUser(this.resource)
  }
}
