import { UnrecoverableError } from "bullmq";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  InstagramApiError,
  InstagramPublisher,
  MockInstagramPublisher,
} from "../src/social/instagram_adapter.js";
import { MockMediaUrlProvider } from "../src/social/media_url_provider.js";
import {
  instagramPayloadHash,
  processInstagramPublication,
  socialBackoffDelay,
} from "../src/social/instagram_processor.js";
import type {
  PublishResult,
  ScheduledInstagramPublication,
  SocialPublicationRepository,
  SocialPublishError,
} from "../src/social/types.js";

class MemoryRepository implements SocialPublicationRepository {
  attempt = 0;
  failures: Array<{ error: SocialPublishError; final: boolean }> = [];
  expired = false;
  published: PublishResult | null = null;

  constructor(
    public record: ScheduledInstagramPublication | null = validRecord(),
  ) {}

  async findForPublish() {
    return this.record;
  }
  async beginAttempt() {
    if (this.record?.remotePostId)
      return { attempt: 0, remotePostId: this.record.remotePostId };
    this.attempt += 1;
    return { attempt: this.attempt, remotePostId: null };
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
}

function validRecord(): ScheduledInstagramPublication {
  const record: ScheduledInstagramPublication = {
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
    externalAccountId: "1234567890",
    encryptedAccessToken: "encrypted-token",
    text: "Bonjour Instagram",
    media: [
      {
        storageKey: "private/image.jpg",
        mimeType: "image/jpeg",
        checksum: "checksum-image",
        position: 0,
      },
    ],
    remotePostId: null,
  };
  record.payloadHash = instagramPayloadHash({
    text: record.text,
    media: record.media,
  });
  return record;
}

function job(attemptsMade = 0) {
  return {
    data: { scheduledPublicationId: "schedule-1" },
    attemptsMade,
    opts: { attempts: 4 },
  };
}

class FailingPublisher extends MockInstagramPublisher {
  constructor(private readonly failure: SocialPublishError) {
    super();
  }
  override async publish(): Promise<PublishResult> {
    throw { normalized: this.failure };
  }
}

describe("Instagram publication worker", () => {
  it("stops permanently when the schedule no longer exists", async () => {
    await expect(
      processInstagramPublication(job(), {
        repository: new MemoryRepository(null),
        publisher: new MockInstagramPublisher(),
        decryptToken: () => "page-token",
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
  });

  it("publishes once and skips a duplicate execution", async () => {
    const repository = new MemoryRepository();
    const publisher = new MockInstagramPublisher();
    const dependencies = {
      repository,
      publisher,
      decryptToken: () => "page-token",
    };
    const first = await processInstagramPublication(job(), dependencies);
    const second = await processInstagramPublication(job(), dependencies);
    expect(first.skipped).toBe(false);
    expect(second.skipped).toBe(true);
    expect(publisher.calls).toBe(1);
    expect(repository.published?.remotePostId).toBe("mock-instagram-1");
  });

  it.each([
    ["timeout", "TimeoutError"],
    ["rate_limit", "4"],
    ["server", "503"],
  ] as const)("retries a transient %s failure", async (category, code) => {
    const repository = new MemoryRepository();
    const publisher = new FailingPublisher({ category, code, retryable: true });
    await expect(
      processInstagramPublication(job(), {
        repository,
        publisher,
        decryptToken: () => "page-token",
      }),
    ).rejects.toThrow(category);
    expect(repository.failures).toEqual([
      { error: { category, code, retryable: true }, final: false },
    ]);
  });

  it("marks the last transient retry as failed", async () => {
    const repository = new MemoryRepository();
    const publisher = new FailingPublisher({
      category: "server",
      code: "503",
      retryable: true,
    });
    await expect(
      processInstagramPublication(job(3), {
        repository,
        publisher,
        decryptToken: () => "page-token",
      }),
    ).rejects.toThrow("server");
    expect(repository.failures[0]?.final).toBe(true);
  });

  it("does not retry a permanent content error", async () => {
    const repository = new MemoryRepository();
    const publisher = new FailingPublisher({
      category: "invalid_content",
      code: "100",
      retryable: false,
    });
    await expect(
      processInstagramPublication(job(), {
        repository,
        publisher,
        decryptToken: () => "page-token",
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
    expect(repository.failures[0]?.final).toBe(true);
  });

  it("blocks stale approved versions before the external call", async () => {
    const record = validRecord();
    record.currentVersion = 3;
    const repository = new MemoryRepository(record);
    const publisher = new MockInstagramPublisher();
    await expect(
      processInstagramPublication(job(), {
        repository,
        publisher,
        decryptToken: () => "page-token",
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
    expect(publisher.calls).toBe(0);
    expect(repository.failures[0]?.error.category).toBe("version_mismatch");
  });

  it("blocks a scheduled payload changed after approval", async () => {
    const record = validRecord();
    record.text = "Contenu modifié";
    const repository = new MemoryRepository(record);
    const publisher = new MockInstagramPublisher();
    await expect(
      processInstagramPublication(job(), {
        repository,
        publisher,
        decryptToken: () => "page-token",
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
    expect(publisher.calls).toBe(0);
    expect(repository.failures[0]?.error.category).toBe("version_mismatch");
  });

  it("marks an expired token and account without retrying", async () => {
    const record = validRecord();
    record.accountExpiresAt = new Date(0);
    const repository = new MemoryRepository(record);
    await expect(
      processInstagramPublication(job(), {
        repository,
        publisher: new MockInstagramPublisher(),
        decryptToken: () => "page-token",
        now: () => new Date(1),
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
    expect(repository.expired).toBe(true);
    expect(repository.failures[0]?.error.category).toBe("token_expired");
  });

  it("uses the documented 1, 5 and 15 minute backoff", () => {
    expect(
      [1, 2, 3].map((attempt) => socialBackoffDelay(attempt, "wepost-social")),
    ).toEqual([60_000, 300_000, 900_000]);
    expect(socialBackoffDelay(1, "other")).toBe(-1);
  });
});

describe("Instagram adapter", () => {
  const urls = new MockMediaUrlProvider();
  const adapter = new InstagramPublisher(
    {
      graphApiVersion: "v-test",
      appSecret: "app-secret",
      timeoutMs: 1000,
      pollIntervalMs: 0,
      maxPollAttempts: 3,
    },
    urls,
  );

  afterEach(() => vi.unstubAllGlobals());

  it("validates the supported single-media scope", async () => {
    const base = {
      scheduledPublicationId: "schedule",
      publicationId: "publication",
      publicationVersion: 1,
      pageId: "17841400000000000",
      accessToken: "page-token",
      text: "Bonjour",
      idempotencyKey: "key",
    };
    expect(await adapter.validate({ ...base, media: [] })).toMatchObject({
      valid: false,
    });
    expect(
      await adapter.validate({
        ...base,
        media: [
          {
            storageKey: "private/image.jpg",
            mimeType: "image/jpeg",
            checksum: "image",
            position: 0,
          },
        ],
      }),
    ).toMatchObject({ valid: true });
    expect(
      await adapter.validate({
        ...base,
        media: [
          {
            storageKey: "private/image.png",
            mimeType: "image/png",
            checksum: "png",
            position: 0,
          },
        ],
      }),
    ).toMatchObject({ valid: false });
  });

  it("creates a container, waits and publishes an image", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "container-1" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status_code: "IN_PROGRESS" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status_code: "FINISHED" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "media-1" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await adapter.publish({
      scheduledPublicationId: "schedule",
      publicationId: "publication",
      publicationVersion: 1,
      pageId: "17841400000000000",
      accessToken: "page-token",
      text: "Image",
      media: [
        {
          storageKey: "private/image.jpg",
          mimeType: "image/jpeg",
          checksum: "checksum-image",
          position: 0,
        },
      ],
      idempotencyKey: "key-image",
    });
    expect(result.remotePostId).toBe("media-1");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("creates a Reels container for a video", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "container-video" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status_code: "FINISHED" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "reel-1" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await adapter.publish({
      scheduledPublicationId: "schedule",
      publicationId: "publication",
      publicationVersion: 1,
      pageId: "17841400000000000",
      accessToken: "page-token",
      text: "Vidéo",
      media: [
        {
          storageKey: "private/video.mp4",
          mimeType: "video/mp4",
          checksum: "checksum-video",
          position: 0,
        },
      ],
      idempotencyKey: "key-video",
    });
    expect(result.remotePostId).toBe("reel-1");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("stops on a failed container and retries a processing timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "container-error" }), {
            status: 200,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ status_code: "ERROR" }), {
            status: 200,
          }),
        ),
    );
    const input = {
      scheduledPublicationId: "schedule",
      publicationId: "publication",
      publicationVersion: 1,
      pageId: "17841400000000000",
      accessToken: "page-token",
      text: "Image",
      media: [
        {
          storageKey: "private/image.jpg",
          mimeType: "image/jpeg",
          checksum: "image",
          position: 0,
        },
      ],
      idempotencyKey: "key-error",
    };
    await expect(adapter.publish(input)).rejects.toMatchObject({
      code: "container_error",
    });

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "container-timeout" }), {
            status: 200,
          }),
        )
        .mockImplementation(() =>
          Promise.resolve(
            new Response(JSON.stringify({ status_code: "IN_PROGRESS" }), {
              status: 200,
            }),
          ),
        ),
    );
    const failure = await adapter
      .publish(input)
      .catch((error: unknown) => error);
    expect(adapter.normalizeError(failure)).toMatchObject({
      category: "timeout",
      retryable: true,
    });
  });

  it("normalizes Meta failures and keeps the mock idempotent", async () => {
    expect(adapter.normalizeError(new InstagramApiError(429, 4))).toMatchObject(
      {
        category: "rate_limit",
        retryable: true,
      },
    );
    expect(adapter.normalizeError(new InstagramApiError(503, 2))).toMatchObject(
      {
        category: "server",
        retryable: true,
      },
    );
    expect(
      adapter.normalizeError(new InstagramApiError(400, 190)),
    ).toMatchObject({
      category: "token_expired",
      retryable: false,
    });
    expect(
      adapter.normalizeError(new InstagramApiError(400, 200)),
    ).toMatchObject({
      category: "permission",
      retryable: false,
    });
    expect(adapter.normalizeError(new TypeError("fetch failed"))).toMatchObject(
      {
        category: "server",
        retryable: true,
      },
    );

    const mock = new MockInstagramPublisher();
    const record = validRecord();
    const input = {
      scheduledPublicationId: record.id,
      publicationId: record.publicationId,
      publicationVersion: record.publicationVersion,
      pageId: record.externalAccountId,
      accessToken: "token",
      text: record.text,
      media: record.media,
      idempotencyKey: record.idempotencyKey,
    };
    expect((await mock.publish(input)).remotePostId).toBe(
      (await mock.publish(input)).remotePostId,
    );
    expect(mock.phases).toContain("container_finished");
  });
});
