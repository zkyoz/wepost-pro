import { hasPermission, type Permission } from '#domain/auth/permissions'
import { recordAuthorizationDenial } from '#services/authorization/authorization_metrics'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class PermissionMiddleware {
  async handle(
    { auth, logger, request, response }: HttpContext,
    next: NextFn,
    options: { permissions: Permission[] }
  ) {
    const user = auth.getUserOrFail()
    const allowed =
      options.permissions.length > 0 &&
      options.permissions.every((permission) => hasPermission(user.role, permission))

    if (!allowed) {
      const metricValue = recordAuthorizationDenial()
      logger.warn(
        {
          event: 'authorization.denied',
          metric: 'authorization_denied_total',
          metricValue,
          userId: user.id,
          route: request.url(),
          permissions: options.permissions,
        },
        'Authorization denied'
      )
      return response.forbidden({
        errors: [{ message: 'Vous ne pouvez pas effectuer cette action.' }],
      })
    }

    return next()
  }
}
