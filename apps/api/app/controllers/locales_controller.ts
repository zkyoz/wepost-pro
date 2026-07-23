import AuditLog from '#models/audit_log'
import { toPublicUser } from '#services/auth/public_user'
import { updateLocaleValidator } from '#validators/translation_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class LocalesController {
  async update({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { locale } = await request.validateUsing(updateLocaleValidator)
    const previousLocale = actor.locale
    actor.locale = locale
    await actor.save()
    await AuditLog.create({
      actorUserId: actor.id,
      targetUserId: actor.id,
      entityType: 'user',
      entityId: actor.id,
      action: 'user.locale_changed',
      previousValues: { locale: previousLocale },
      nextValues: { locale },
    })
    logger.info({ event: 'user.locale_changed', actorId: actor.id, locale })
    return response.ok({ data: toPublicUser(actor) })
  }
}
