import { PublicationSchema } from '#database/schema'
import type { PublicationStatus, SocialNetwork } from '#domain/publications/publication_lifecycle'

export default class Publication extends PublicationSchema {
  declare status: PublicationStatus
  declare targetNetworks: SocialNetwork[]
}
