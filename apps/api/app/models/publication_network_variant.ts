import { PublicationNetworkVariantSchema } from '#database/schema'
import type { SocialNetwork } from '#domain/publications/publication_lifecycle'
import type { NetworkVariantStatus } from '#domain/publications/network_variant'

export default class PublicationNetworkVariant extends PublicationNetworkVariantSchema {
  declare network: SocialNetwork
  declare status: NetworkVariantStatus
}
