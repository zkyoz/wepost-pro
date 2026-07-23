import { canViewUser } from '#domain/auth/resource_scope'
import User from '#models/user'
import UserTransformer from '#transformers/user_transformer'
import { userIdValidator } from '#validators/admin/user_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async show({ auth, request, response, serialize }: HttpContext) {
    const { params } = await request.validateUsing(userIdValidator)
    const actor = auth.getUserOrFail()
    const target = await User.find(params.id)

    if (!target || !canViewUser(actor, target)) {
      return response.notFound({ errors: [{ message: 'Ressource introuvable.' }] })
    }

    return serialize(UserTransformer.transform(target))
  }
}
