import UserTransformer from '#transformers/user_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class MeController {
  async show({ auth, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(auth.getUserOrFail()))
  }
}
