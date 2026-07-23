import { UnrecoverableError, type Job } from "bullmq";
import { PermanentEmailError } from "./resend_sender.js";
import {
  UnsupportedNotificationError,
  renderNotificationEmail,
} from "./template.js";
import type {
  EmailSender,
  NotificationEmailJob,
  NotificationRepository,
} from "./types.js";

export type ProcessorDependencies = {
  repository: NotificationRepository;
  sender: EmailSender;
  webAppUrl: string;
};

export function emailBackoffDelay(attemptsMade: number, type?: string) {
  if (type !== "wepost-email") return -1;
  return [60_000, 300_000, 900_000][attemptsMade - 1] ?? -1;
}

export async function processNotificationEmail(
  job: Pick<Job<NotificationEmailJob>, "data" | "attemptsMade" | "opts">,
  dependencies: ProcessorDependencies,
) {
  const attempt = job.attemptsMade + 1;
  const maxAttempts = job.opts.attempts ?? 1;
  try {
    const notification = await dependencies.repository.findForEmail(
      job.data.notificationId,
    );
    if (!notification) throw new PermanentEmailError("NotificationNotFound");
    if (notification.emailStatus === "sent") return { skipped: true };
    if (job.data.templateVersion !== "activity-v1") {
      throw new PermanentEmailError("UnsupportedTemplateVersion");
    }
    const message = renderNotificationEmail(
      notification,
      dependencies.webAppUrl,
    );
    const providerId = await dependencies.sender.send(
      message,
      `wepost-${job.data.templateVersion}-${notification.id}`,
    );
    await dependencies.repository.markSent(notification.id, attempt);
    return { skipped: false, providerId };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    await dependencies.repository.recordAttempt(
      job.data.notificationId,
      attempt,
      errorName,
    );
    const permanent =
      error instanceof PermanentEmailError ||
      error instanceof UnsupportedNotificationError;
    if (permanent || attempt >= maxAttempts) {
      await dependencies.repository.markFailed(
        job.data.notificationId,
        attempt,
        errorName,
      );
    }
    if (permanent) throw new UnrecoverableError(errorName);
    throw error instanceof Error ? error : new Error("UnknownError");
  }
}
