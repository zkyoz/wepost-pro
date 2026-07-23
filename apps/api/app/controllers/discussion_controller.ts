import { discussionView } from '#services/collaboration/discussion_service'
import { findAccessiblePublication } from '#services/publications/publication_service'
import { publicationDiscussionValidator } from '#validators/collaboration_validator'
import type { HttpContext } from '@adonisjs/core/http'

const notFound = { errors: [{ message: 'Publication introuvable.' }] }

export default class DiscussionController {
  async show({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(publicationDiscussionValidator)
    const publication = await findAccessiblePublication(actor, params.id)
    if (!publication) return response.notFound(notFound)
    return response.ok({ data: await discussionView(publication.id, actor) })
  }
}
