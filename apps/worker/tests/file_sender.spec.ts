import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileEmailSender } from "../src/file_sender.js";
import { loadConfig } from "../src/config.js";

describe("local demonstration email delivery", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("captures a readable message once, including when its job is retried", async () => {
    const directory = await mkdtemp(join(tmpdir(), "wepost-demo-email-"));
    try {
      const sender = new FileEmailSender(directory);
      const message = {
        to: "client@wepost.local",
        subject: "Validation",
        html: "<p>Publication approuvée</p>",
        text: "Publication approuvée",
      };
      const ids = await Promise.all([
        sender.send(message, "../../one-notification"),
        sender.send(message, "../../one-notification"),
      ]);
      expect(ids[0]).toEqual(ids[1]);
      const files = await readdir(directory);
      expect(files).toHaveLength(2);
      expect(
        files.every((file) => /^[a-f0-9]{64}\.(html|json)$/.test(file)),
      ).toBe(true);
      const capture = JSON.parse(
        await readFile(
          join(
            directory,
            files.find((file) => file.endsWith(".json"))!,
          ),
          "utf8",
        ),
      );
      expect(capture).toMatchObject({
        delivery: "local-demo-outbox",
        ...message,
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("refuses local capture in production and with a remote database", () => {
    vi.stubEnv("EMAIL_DELIVERY_DRIVER", "file");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => loadConfig()).toThrow("développement local");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DB_HOST", "database.example.com");
    expect(() => loadConfig()).toThrow("développement local");
  });

  it("rejects an unknown driver instead of silently simulating delivery", () => {
    vi.stubEnv("EMAIL_DELIVERY_DRIVER", "unknown");
    expect(() => loadConfig()).toThrow("EMAIL_DELIVERY_DRIVER invalide");
  });
});
