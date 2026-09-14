import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { EmailSender, RenderedEmail } from "./types.js";

/** Local outbox for rehearsals. No message is sent to an external provider. */
export class FileEmailSender implements EmailSender {
  constructor(private readonly directory: string) {}

  async send(message: RenderedEmail, idempotencyKey: string) {
    const id = createHash("sha256").update(idempotencyKey).digest("hex");
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    for (const [extension, content] of [
      ["html", message.html],
      [
        "json",
        JSON.stringify({ delivery: "local-demo-outbox", ...message }, null, 2),
      ],
    ]) {
      try {
        await writeFile(join(this.directory, `${id}.${extension}`), content!, {
          flag: "wx",
          mode: 0o600,
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
    }
    return `local-demo-${id}`;
  }
}
