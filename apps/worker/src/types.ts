export const EMAIL_TEMPLATE_VERSION = "activity-v1" as const;

export type NotificationEmailJob = {
  notificationId: string;
  templateVersion: typeof EMAIL_TEMPLATE_VERSION;
};

export type EmailDeliveryStatus = "pending" | "sent" | "failed";

export type EmailNotificationRecord = {
  id: string;
  type: string;
  payload: { publicationId?: string; projectId?: string };
  recipientEmail: string;
  recipientName: string;
  emailStatus: EmailDeliveryStatus;
};

export type RenderedEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export interface NotificationRepository {
  findForEmail(id: string): Promise<EmailNotificationRecord | null>;
  recordAttempt(id: string, attempt: number, errorName: string): Promise<void>;
  markSent(id: string, attempt: number): Promise<void>;
  markFailed(id: string, attempt: number, errorName: string): Promise<void>;
}

export interface EmailSender {
  send(message: RenderedEmail, idempotencyKey: string): Promise<string>;
}
