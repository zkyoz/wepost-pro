import type { HttpContext } from '@adonisjs/core/http'

export default class CsrfController {
  show({ response }: HttpContext) {
    return response.noContent()
  }
}
