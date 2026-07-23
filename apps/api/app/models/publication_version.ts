import { PublicationVersionSchema } from '#database/schema'

export type PublicationSnapshot = {
  title: string
  baseText: string
  status: string
  targetNetworks: string[]
  scheduledAt: string | null
  timezone: string
}

export default class PublicationVersion extends PublicationVersionSchema {
  declare snapshotJson: PublicationSnapshot
}
