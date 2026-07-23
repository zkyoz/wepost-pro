import { NotificationSchema } from '#database/schema'
import type {
  EmailDeliveryStatus,
  NotificationPayload,
  NotificationType,
} from '#services/notifications/notification_service'

export default class Notification extends NotificationSchema {
  declare type: NotificationType
  declare payloadJson: NotificationPayload
  declare emailStatus: EmailDeliveryStatus
}
