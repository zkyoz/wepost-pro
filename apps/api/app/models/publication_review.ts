import { PublicationReviewSchema } from '#database/schema'
import type { ReviewDecision } from '#domain/collaboration/review'

export default class PublicationReview extends PublicationReviewSchema {
  declare decision: ReviewDecision
}
