import { MediaAssetSchema } from '#database/schema'

export type MediaScanStatus = 'pending_upload' | 'clean' | 'rejected' | 'quarantined'

export default class MediaAsset extends MediaAssetSchema {
  declare scanStatus: MediaScanStatus
}
