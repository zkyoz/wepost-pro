import User from '#models/user'
import UserTransformer from '#transformers/user_transformer'
import { loginValidator } from '#validators/auth/login_validator'
import { errors as authErrors } from '@adonisjs/auth'
import type { HttpContext } from '@adonisjs/core/http'

const invalidCredentials = {
  errors: [{ message: 'Adresse e-mail ou mot de passe incorrect.' }],
}

export default class SessionController {
  async store({ auth, logger, request, response, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    let user: User
    try {
      user = await User.verifyCredentials(email, password)
    } catch (error) {
      if (!authErrors.E_INVALID_CREDENTIALS.isError(error)) {
        throw error
      }
      logger.warn({ event: 'auth.login.failed', reason: 'invalid_credentials' }, 'Login failed')
      return response.unauthorized(invalidCredentials)
    }

    if (!user.isActive) {
      logger.warn({ event: 'auth.login.failed', reason: 'inactive_account' }, 'Login failed')
      return response.unauthorized(invalidCredentials)
    }

    await auth.use('web').login(user)
    logger.info({ event: 'auth.login.succeeded', userId: user.id }, 'Login succeeded')
    return serialize(UserTransformer.transform(user))
  }

  async destroy({ auth, logger, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    await auth.use('web').logout()
    logger.info({ event: 'auth.logout.succeeded', userId: user.id }, 'Logout succeeded')
    return serialize({ message: 'Session fermée.' })
  }
}
