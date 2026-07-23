import { Resend } from "resend";
import type { EmailSender, RenderedEmail } from "./types.js";

export class PermanentEmailError extends Error {
  override name = "PermanentEmailError";
}

export class ResendEmailSender implements EmailSender {
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async send(message: RenderedEmail, idempotencyKey: string) {
    const { data, error } = await this.resend.emails.send(
      { from: this.from, ...message },
      { idempotencyKey },
    );
    if (error) {
      const statusCode =
        "statusCode" in error ? Number(error.statusCode) : undefined;
      const errorName = error.name || "ResendError";
      if (
        statusCode &&
        statusCode >= 400 &&
        statusCode < 500 &&
        statusCode !== 429
      ) {
        throw new PermanentEmailError(errorName);
      }
      throw new Error(errorName);
    }
    if (!data?.id) throw new Error("ResendEmptyResponse");
    return data.id;
  }
}
