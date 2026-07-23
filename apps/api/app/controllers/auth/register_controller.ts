import User from '#models/user'
import UserTransformer from '#transformers/user_transformer'
import { registerValidator } from '#validators/auth/register_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class RegisterController {
  async store({ auth, logger, request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    const user = await User.create({
      displayName: payload.displayName,
      email: payload.email,
      password: payload.password,
      role: 'client',
      isActive: true,
    })

    await auth.use('web').login(user)
    logger.info({ event: 'auth.register.succeeded', userId: user.id }, 'User registered')

    response.status(201)
    return serialize(UserTransformer.transform(user))
  }
}
