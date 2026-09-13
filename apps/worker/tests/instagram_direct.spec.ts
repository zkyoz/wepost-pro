import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstagramPublisher } from "../src/social/instagram_adapter.js";
import {
  DemoImageUrlProvider,
  MockMediaUrlProvider,
} from "../src/social/media_url_provider.js";
import { loadConfig } from "../src/config.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Instagram Login publication", () => {
  it("uses only graph.instagram.com with a user Bearer token, without Facebook proof", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ id: "container" }))
      .mockResolvedValueOnce(Response.json({ status_code: "FINISHED" }))
      .mockResolvedValueOnce(Response.json({ id: "real-id" }));
    vi.stubGlobal("fetch", fetcher);
    const publisher = new InstagramPublisher(
      { graphApiVersion: "v26.0", loginMode: "instagram" },
      new MockMediaUrlProvider(),
    );
    const result = await publisher.publish({
      scheduledPublicationId: "schedule",
      publicationId: "publication",
      publicationVersion: 1,
      pageId: "17841400000000000",
      accessToken: "test-only-token",
      text: "Test",
      idempotencyKey: "unique",
      media: [
        {
          storageKey: "image.jpg",
          mimeType: "image/jpeg",
          checksum: "image",
          position: 0,
        },
      ],
    });
    expect(result.remotePostId).toBe("real-id");
    expect(fetcher).toHaveBeenCalledTimes(3);
    for (const [url, options] of fetcher.mock.calls) {
      expect(new URL(url).origin).toBe("https://graph.instagram.com");
      expect(url).not.toContain("appsecret_proof");
      expect(options.headers.authorization).toBe("Bearer test-only-token");
      if (options.body) expect(options.body.has("appsecret_proof")).toBe(false);
    }
  });

  it("only signs the exact approved demo image", async () => {
    const bytes = Buffer.from("approved JPEG");
    const sha = createHash("sha256").update(bytes).digest("hex");
    const loader = {
      load: vi
        .fn()
        .mockResolvedValueOnce(bytes)
        .mockResolvedValueOnce(Buffer.from("private file")),
    };
    const provider = new DemoImageUrlProvider(
      loader,
      "https://test.trycloudflare.com/opaque.jpg",
      sha,
    );
    expect(await provider.sign("approved.jpg")).toBe(
      "https://test.trycloudflare.com/opaque.jpg",
    );
    await expect(provider.sign("another.jpg")).rejects.toThrow(
      "DemoImageNotAuthorized",
    );
    for (const url of [
      "http://test.trycloudflare.com/image",
      "https://example.com/image",
      "https://user:password@test.trycloudflare.com/image",
    ])
      expect(() => new DemoImageUrlProvider(loader, url, sha)).toThrow(
        "InvalidDemoImageConfiguration",
      );
    expect(
      () =>
        new DemoImageUrlProvider(
          loader,
          "https://test.trycloudflare.com/image",
          "bad",
        ),
    ).toThrow();
  });

  it("rejects unsupported modes and public demo media outside local development", () => {
    vi.stubEnv("EMAIL_DELIVERY_DRIVER", "resend");
    vi.stubEnv("FACEBOOK_API_DRIVER", "mock");
    vi.stubEnv("INSTAGRAM_API_DRIVER", "wrong");
    expect(() => loadConfig()).toThrow("INSTAGRAM_API_DRIVER invalide");
    vi.stubEnv("INSTAGRAM_API_DRIVER", "instagram");
    vi.stubEnv("INSTAGRAM_LOGIN_MODE", "wrong");
    expect(() => loadConfig()).toThrow("INSTAGRAM_LOGIN_MODE invalide");
    vi.stubEnv("INSTAGRAM_LOGIN_MODE", "instagram");
    vi.stubEnv("LINKEDIN_API_DRIVER", "mock");
    vi.stubEnv("PINTEREST_API_DRIVER", "mock");
    vi.stubEnv("MEDIA_STORAGE_DRIVER", "r2");
    vi.stubEnv(
      "INSTAGRAM_DEMO_IMAGE_URL",
      "https://test.trycloudflare.com/image",
    );
    expect(() => loadConfig()).toThrow("réservé au développement local réel");
  });
});
