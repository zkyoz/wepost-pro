import { UnrecoverableError } from "bullmq";
import { describe, expect, it, vi } from "vitest";
import {
  emailBackoffDelay,
  processNotificationEmail,
} from "../src/processor.js";
import { PermanentEmailError } from "../src/resend_sender.js";
import { renderNotificationEmail } from "../src/template.js";
import type {
  EmailNotificationRecord,
  EmailSender,
  NotificationEmailJob,
  NotificationRepository,
} from "../src/types.js";

const notification: EmailNotificationRecord = {
  id: "70000000-0000-4000-8000-000000000001",
  type: "publication.comment_created",
  payload: { publicationId: "70000000-0000-4000-8000-000000000002" },
  recipientEmail: "client@example.test",
  recipientName: "Client Test",
  emailStatus: "pending",
};

function job(attemptsMade = 0, attempts = 3) {
  return {
    data: {
      notificationId: notification.id,
      templateVersion: "activity-v1" as const,
    },
    attemptsMade,
    opts: { attempts },
  };
}

function dependencies(sender: EmailSender) {
  const repository: NotificationRepository = {
    findForEmail: vi.fn().mockResolvedValue(notification),
    recordAttempt: vi.fn().mockResolvedValue(undefined),
    markSent: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
  };
  return { repository, sender, webAppUrl: "https://app.wepost.pro" };
}

describe("notification email worker", () => {
  it("sends HTML and text then persists success", async () => {
    const sender: EmailSender = { send: vi.fn().mockResolvedValue("email-1") };
    const deps = dependencies(sender);
    await expect(processNotificationEmail(job(), deps)).resolves.toEqual({
      skipped: false,
      providerId: "email-1",
    });
    expect(sender.send).toHaveBeenCalledOnce();
    expect(deps.repository.markSent).toHaveBeenCalledWith(notification.id, 1);
  });

  it("throws a transient error so BullMQ retries without marking final failure", async () => {
    const sender: EmailSender = {
      send: vi.fn().mockRejectedValue(new Error("NetworkError")),
    };
    const deps = dependencies(sender);
    await expect(processNotificationEmail(job(0, 3), deps)).rejects.toThrow(
      "NetworkError",
    );
    expect(deps.repository.recordAttempt).toHaveBeenCalledWith(
      notification.id,
      1,
      "Error",
    );
    expect(deps.repository.markFailed).not.toHaveBeenCalled();
  });

  it("persists a definitive failure after the last attempt", async () => {
    const sender: EmailSender = {
      send: vi.fn().mockRejectedValue(new Error("NetworkError")),
    };
    const deps = dependencies(sender);
    await expect(processNotificationEmail(job(2, 3), deps)).rejects.toThrow(
      "NetworkError",
    );
    expect(deps.repository.markFailed).toHaveBeenCalledWith(
      notification.id,
      3,
      "Error",
    );
  });

  it("stops retries immediately for a permanent provider error", async () => {
    const sender: EmailSender = {
      send: vi
        .fn()
        .mockRejectedValue(new PermanentEmailError("InvalidRecipient")),
    };
    const deps = dependencies(sender);
    await expect(processNotificationEmail(job(), deps)).rejects.toBeInstanceOf(
      UnrecoverableError,
    );
    expect(deps.repository.markFailed).toHaveBeenCalledWith(
      notification.id,
      1,
      "PermanentEmailError",
    );
  });

  it("uses the documented retry delays", () => {
    expect(
      [1, 2, 3].map((attempt) => emailBackoffDelay(attempt, "wepost-email")),
    ).toEqual([60_000, 300_000, 900_000]);
    expect(emailBackoffDelay(1, "other")).toBe(-1);
  });

  it("skips an already delivered notification", async () => {
    const sender: EmailSender = { send: vi.fn() };
    const deps = dependencies(sender);
    vi.mocked(deps.repository.findForEmail).mockResolvedValue({
      ...notification,
      emailStatus: "sent",
    });
    await expect(processNotificationEmail(job(), deps)).resolves.toEqual({
      skipped: true,
    });
    expect(sender.send).not.toHaveBeenCalled();
  });

  it("fails permanently when no safe template exists", async () => {
    const sender: EmailSender = { send: vi.fn() };
    const deps = dependencies(sender);
    vi.mocked(deps.repository.findForEmail).mockResolvedValue({
      ...notification,
      type: "unknown",
    });
    await expect(processNotificationEmail(job(), deps)).rejects.toBeInstanceOf(
      UnrecoverableError,
    );
    expect(deps.repository.markFailed).toHaveBeenCalled();
  });

  it("escapes template values and never includes a comment body", () => {
    const rendered = renderNotificationEmail(
      { ...notification, recipientName: "<img src=x onerror=alert(1)>" },
      "https://app.wepost.pro",
    );
    expect(rendered.html).toContain("&lt;img");
    expect(rendered.html).not.toContain("<img");
    expect(rendered.text).not.toContain("Corps du commentaire");
  });
});
