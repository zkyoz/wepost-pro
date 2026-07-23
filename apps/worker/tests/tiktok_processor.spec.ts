import { UnrecoverableError } from "bullmq";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MockMediaLoader } from "../src/social/media_loader.js";
import {
  MockTikTokPublisher,
  TikTokApiError,
  TikTokPublisher,
} from "../src/social/tiktok_adapter.js";
import {
  processTikTokPublication,
  socialBackoffDelay,
  tiktokPayloadHash,
} from "../src/social/tiktok_processor.js";
import type {
  PublishResult,
  ScheduledTikTokPublication,
  SocialPublicationRepository,
  SocialPublishError,
} from "../src/social/types.js";

const video = {
  privacyLevel: "SELF_ONLY",
  caption: "Bonjour TikTok",
  disableComment: false,
  disableDuet: false,
  disableStitch: false,
  brandContentToggle: false,
  brandOrganicToggle: true,
  isAigc: false,
};

function validRecord(): ScheduledTikTokPublication {
  const record: ScheduledTikTokPublication = {
    id: "schedule-1",
    publicationId: "publication-1",
    publicationVersion: 2,
    currentVersion: 2,
    approvedVersion: 2,
    publicationStatus: "scheduled",
    idempotencyKey: "idempotency-key",
    payloadHash: "",
    accountId: "account-1",
    accountStatus: "connected",
    accountExpiresAt: new Date(Date.now() + 60_000),
    externalAccountId: "open-id",
    encryptedAccessToken: "encrypted-token",
    text: "Bonjour TikTok",
    networkPayload: video,
    media: [
      {
        storageKey: "private/video.mp4",
        mimeType: "video/mp4",
        checksum: "sum",
        position: 0,
        sizeBytes: 20,
      },
    ],
    remotePostId: null,
    providerJobId: null,
    providerStatus: null,
  };
  record.payloadHash = tiktokPayloadHash({ video, media: record.media });
  return record;
}

class MemoryRepository implements SocialPublicationRepository {
  attempt = 0;
  failures: Array<{ error: SocialPublishError; final: boolean }> = [];
  published: PublishResult | null = null;
  expired = false;
  constructor(
    public record: ScheduledTikTokPublication | null = validRecord(),
  ) {}
  async findForPublish() {
    return this.record;
  }
  async beginAttempt() {
    return {
      attempt: ++this.attempt,
      remotePostId: this.record?.remotePostId ?? null,
    };
  }
  async ensurePublished(_id: string, remotePostId: string) {
    if (this.record) this.record.remotePostId = remotePostId;
  }
  async markPublished(_id: string, _attempt: number, result: PublishResult) {
    this.published = result;
    if (this.record) this.record.remotePostId = result.remotePostId;
  }
  async markAttemptFailed(
    _id: string,
    _attempt: number,
    error: SocialPublishError,
    final: boolean,
  ) {
    this.failures.push({ error, final });
  }
  async markAccountExpired() {
    this.expired = true;
  }
  async markProviderJob(
    _id: string,
    providerJobId: string,
    providerStatus: string,
  ) {
    if (this.record) {
      this.record.providerJobId = providerJobId;
      this.record.providerStatus = providerStatus;
    }
  }
}

const job = (attemptsMade = 0) => ({
  data: { scheduledPublicationId: "schedule-1" },
  attemptsMade,
  opts: { attempts: 4 },
});

describe("TikTok publication worker", () => {
  it("fails permanently when the schedule is missing", async () => {
    await expect(
      processTikTokPublication(job(), {
        repository: new MemoryRepository(null),
        publisher: new MockTikTokPublisher(),
        decryptToken: () => "token",
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
  });

  it("resumes the same publish_id while processing then publishes", async () => {
    const repository = new MemoryRepository();
    const publisher = new MockTikTokPublisher();
    const dependencies = { repository, publisher, decryptToken: () => "token" };
    await expect(processTikTokPublication(job(), dependencies)).rejects.toThrow(
      "processing_pending",
    );
    expect(repository.record?.providerJobId).toBe("mock-tiktok-1");
    const result = await processTikTokPublication(job(1), dependencies);
    expect(result.remotePostId).toBe("mock-tiktok-1");
    expect(publisher.calls).toBe(1);
  });

  it("skips a schedule that already has a remote id", async () => {
    const repository = new MemoryRepository();
    repository.record!.remotePostId = "remote";
    const result = await processTikTokPublication(job(), {
      repository,
      publisher: new MockTikTokPublisher(),
      decryptToken: () => "token",
    });
    expect(result.skipped).toBe(true);
  });

  it("marks a remote failure permanent", async () => {
    const repository = new MemoryRepository();
    const publisher = new MockTikTokPublisher();
    publisher.statusSequences.set("mock-tiktok-1", ["FAILED"]);
    await expect(
      processTikTokPublication(job(), {
        repository,
        publisher,
        decryptToken: () => "token",
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
    expect(repository.failures[0]?.final).toBe(true);
  });

  it("retries API failures and marks the final retry", async () => {
    class Failing extends MockTikTokPublisher {
      override async fetchStatus(): Promise<never> {
        throw new TikTokApiError(503, "internal");
      }
      override normalizeError() {
        return {
          category: "server" as const,
          code: "internal",
          retryable: true,
        };
      }
    }
    for (const attempt of [0, 3]) {
      const repository = new MemoryRepository();
      await expect(
        processTikTokPublication(job(attempt), {
          repository,
          publisher: new Failing(),
          decryptToken: () => "token",
        }),
      ).rejects.toThrow("internal");
      expect(repository.failures[0]?.final).toBe(attempt === 3);
    }
  });

  it("blocks changed versions and payloads", async () => {
    for (const mutate of [
      (r: ScheduledTikTokPublication) => {
        r.currentVersion = 3;
      },
      (r: ScheduledTikTokPublication) => {
        r.networkPayload = { ...video, caption: "changed" };
      },
    ]) {
      const repository = new MemoryRepository();
      mutate(repository.record!);
      await expect(
        processTikTokPublication(job(), {
          repository,
          publisher: new MockTikTokPublisher(),
          decryptToken: () => "token",
        }),
      ).rejects.toBeInstanceOf(UnrecoverableError);
    }
  });

  it("expires an unusable account", async () => {
    const repository = new MemoryRepository();
    repository.record!.accountExpiresAt = new Date(0);
    await expect(
      processTikTokPublication(job(), {
        repository,
        publisher: new MockTikTokPublisher(),
        decryptToken: () => "token",
        now: () => new Date(1),
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
    expect(repository.expired).toBe(true);
  });

  it("uses the required 1, 5 and 15 minute backoff", () => {
    expect(
      [1, 2, 3].map((value) => socialBackoffDelay(value, "wepost-social")),
    ).toEqual([60_000, 300_000, 900_000]);
    expect(socialBackoffDelay(1, "other")).toBe(-1);
  });
});

describe("TikTok adapter", () => {
  const base = {
    scheduledPublicationId: "schedule",
    publicationId: "publication",
    publicationVersion: 1,
    pageId: "open-id",
    accessToken: "token",
    text: "Texte",
    idempotencyKey: "key",
    networkPayload: video,
    media: [
      {
        storageKey: "video.mp4",
        mimeType: "video/mp4",
        checksum: "sum",
        position: 0,
        sizeBytes: 20,
      },
    ],
  };
  afterEach(() => vi.unstubAllGlobals());

  it("rejects non-official API and upload hosts", async () => {
    expect(
      () =>
        new TikTokPublisher(
          { apiBaseUrl: "https://example.test" },
          new MockMediaLoader(),
        ),
    ).toThrow("TIKTOK_API_BASE_URL invalide");
    const adapter = new TikTokPublisher(
      { apiBaseUrl: "https://open.tiktokapis.com" },
      new MockMediaLoader(),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              publish_id: "id",
              upload_url: "https://evil.test/upload",
            },
            error: { code: "ok" },
          }),
          { status: 200 },
        ),
      ),
    );
    await expect(adapter.start(base)).rejects.toMatchObject({
      code: "untrusted_upload_url",
    });
  });

  it("initializes and uploads a private MP4 then reads pending and complete statuses", async () => {
    const adapter = new TikTokPublisher(
      { apiBaseUrl: "https://open.tiktokapis.com" },
      new MockMediaLoader(),
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              publish_id: "publish-1",
              upload_url: "https://open-upload.tiktokapis.com/upload",
            },
            error: { code: "ok" },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 201 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { status: "PROCESSING_UPLOAD" },
            error: { code: "ok" },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { status: "PUBLISH_COMPLETE" },
            error: { code: "ok" },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const initialized = vi.fn();
    expect(await adapter.start(base, async (id) => initialized(id))).toEqual({
      publishId: "publish-1",
    });
    expect(initialized).toHaveBeenCalledWith("publish-1");
    expect((await adapter.fetchStatus("token", "publish-1")).state).toBe(
      "pending",
    );
    expect((await adapter.fetchStatus("token", "publish-1")).state).toBe(
      "published",
    );
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("validates content and normalizes common API errors", async () => {
    const adapter = new TikTokPublisher(
      { apiBaseUrl: "https://open.tiktokapis.com" },
      new MockMediaLoader(),
    );
    expect((await adapter.validate(base)).valid).toBe(true);
    expect((await adapter.validate({ ...base, media: [] })).valid).toBe(false);
    expect(
      (
        await adapter.validate({
          ...base,
          networkPayload: {
            ...video,
            privacyLevel: "",
            caption: "x".repeat(2201),
          },
        })
      ).valid,
    ).toBe(false);
    expect(
      adapter.normalizeError(new TikTokApiError(429, "rate")),
    ).toMatchObject({ category: "rate_limit", retryable: true });
    expect(
      adapter.normalizeError(new TikTokApiError(401, "expired")),
    ).toMatchObject({ category: "token_expired", retryable: false });
    expect(
      adapter.normalizeError(new TikTokApiError(403, "scope")),
    ).toMatchObject({ category: "permission", retryable: false });
    expect(
      adapter.normalizeError(new TikTokApiError(422, "invalid")),
    ).toMatchObject({ category: "invalid_content", retryable: false });
  });

  it("maps remote failure and publish outcomes", async () => {
    const adapter = new TikTokPublisher(
      { apiBaseUrl: "https://open.tiktokapis.com" },
      new MockMediaLoader(),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { status: "FAILED", fail_reason: "video_pull_failed" },
            error: { code: "ok" },
          }),
          { status: 200 },
        ),
      ),
    );
    expect(await adapter.fetchStatus("token", "publish")).toMatchObject({
      state: "failed",
      failReason: "video_pull_failed",
    });

    vi.spyOn(adapter, "start").mockResolvedValue({ publishId: "publish" });
    vi.spyOn(adapter, "fetchStatus").mockResolvedValue({
      state: "published",
      code: "PUBLISH_COMPLETE",
    });
    expect((await adapter.publish(base)).remotePostId).toBe("publish");
    vi.spyOn(adapter, "fetchStatus").mockResolvedValue({
      state: "pending",
      code: "PROCESSING_UPLOAD",
    });
    await expect(adapter.publish(base)).rejects.toMatchObject({
      code: "processing_pending",
    });
  });

  it("rejects provider contracts and normalizes remaining errors", async () => {
    const adapter = new TikTokPublisher(
      { apiBaseUrl: "https://open.tiktokapis.com" },
      new MockMediaLoader(),
    );
    expect(
      (
        await adapter.validate({
          ...base,
          media: [{ ...base.media[0]!, mimeType: "image/jpeg" }],
        })
      ).valid,
    ).toBe(false);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "invalid_param" } }), {
          status: 400,
        }),
      ),
    );
    await expect(adapter.start(base)).rejects.toMatchObject({
      code: "invalid_param",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: {}, error: { code: "ok" } }), {
          status: 200,
        }),
      ),
    );
    await expect(adapter.start(base)).rejects.toMatchObject({
      code: "missing_upload_contract",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "internal" } }), {
          status: 500,
        }),
      ),
    );
    await expect(adapter.fetchStatus("token", "publish")).rejects.toMatchObject(
      { code: "internal" },
    );

    vi.spyOn(adapter, "start").mockResolvedValue({ publishId: "publish" });
    vi.spyOn(adapter, "fetchStatus").mockResolvedValue({
      state: "failed",
      code: "FAILED",
      failReason: "invalid_video",
    });
    await expect(adapter.publish(base)).rejects.toMatchObject({
      code: "invalid_video",
    });
    await expect(adapter.refreshCredentials()).rejects.toMatchObject({
      code: "access_token_invalid",
    });
    expect(
      adapter.normalizeError(new TikTokApiError(503, "internal")),
    ).toMatchObject({
      category: "server",
      retryable: true,
    });
    expect(
      adapter.normalizeError(
        Object.assign(new Error(), { name: "TimeoutError" }),
      ),
    ).toMatchObject({
      category: "timeout",
      retryable: true,
    });
    expect(adapter.normalizeError(new TypeError())).toMatchObject({
      category: "server",
      retryable: true,
    });
    expect(adapter.normalizeError({})).toMatchObject({ category: "unknown" });

    const mock = new MockTikTokPublisher();
    expect(
      mock.normalizeError({
        normalized: { category: "rate_limit", code: "429", retryable: true },
      }),
    ).toMatchObject({ category: "rate_limit" });
  });
});
