import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class GuestMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    if (auth.isAuthenticated) {
      return response.conflict({
        errors: [{ message: 'Une session est déjà ouverte.' }],
      })
    }
    return next()
  }
}
