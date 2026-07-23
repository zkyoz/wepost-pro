import { UnrecoverableError } from "bullmq";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FacebookApiError,
  FacebookPublisher,
  MockFacebookPublisher,
} from "../src/social/facebook_adapter.js";
import { MockMediaLoader } from "../src/social/media_loader.js";
import {
  facebookPayloadHash,
  processFacebookPublication,
  socialBackoffDelay,
} from "../src/social/processor.js";
import type {
  PublishResult,
  ScheduledFacebookPublication,
  SocialPublicationRepository,
  SocialPublishError,
} from "../src/social/types.js";

class MemoryRepository implements SocialPublicationRepository {
  attempt = 0;
  failures: Array<{ error: SocialPublishError; final: boolean }> = [];
  expired = false;
  published: PublishResult | null = null;

  constructor(
    public record: ScheduledFacebookPublication | null = validRecord(),
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

function validRecord(): ScheduledFacebookPublication {
  const record: ScheduledFacebookPublication = {
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
    text: "Bonjour Facebook",
    media: [],
    remotePostId: null,
  };
  record.payloadHash = facebookPayloadHash({
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

class FailingPublisher extends MockFacebookPublisher {
  constructor(private readonly failure: SocialPublishError) {
    super();
  }
  override async publish(): Promise<PublishResult> {
    throw { normalized: this.failure };
  }
}

describe("Facebook publication worker", () => {
  it("stops permanently when the schedule no longer exists", async () => {
    await expect(
      processFacebookPublication(job(), {
        repository: new MemoryRepository(null),
        publisher: new MockFacebookPublisher(),
        decryptToken: () => "page-token",
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
  });

  it("publishes once and skips a duplicate execution", async () => {
    const repository = new MemoryRepository();
    const publisher = new MockFacebookPublisher();
    const dependencies = {
      repository,
      publisher,
      decryptToken: () => "page-token",
    };
    const first = await processFacebookPublication(job(), dependencies);
    const second = await processFacebookPublication(job(), dependencies);
    expect(first.skipped).toBe(false);
    expect(second.skipped).toBe(true);
    expect(publisher.calls).toBe(1);
    expect(repository.published?.remotePostId).toBe("mock-facebook-1");
  });

  it.each([
    ["timeout", "TimeoutError"],
    ["rate_limit", "4"],
    ["server", "503"],
  ] as const)("retries a transient %s failure", async (category, code) => {
    const repository = new MemoryRepository();
    const publisher = new FailingPublisher({ category, code, retryable: true });
    await expect(
      processFacebookPublication(job(), {
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
      processFacebookPublication(job(3), {
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
      processFacebookPublication(job(), {
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
    const publisher = new MockFacebookPublisher();
    await expect(
      processFacebookPublication(job(), {
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
    const publisher = new MockFacebookPublisher();
    await expect(
      processFacebookPublication(job(), {
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
      processFacebookPublication(job(), {
        repository,
        publisher: new MockFacebookPublisher(),
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

describe("Facebook adapter", () => {
  const loader = new MockMediaLoader();
  const adapter = new FacebookPublisher(
    { graphApiVersion: "v-test", appSecret: "app-secret", timeoutMs: 1000 },
    loader,
  );

  afterEach(() => vi.unstubAllGlobals());

  it("rejects an unspecified Graph API version", () => {
    expect(
      () =>
        new FacebookPublisher(
          { graphApiVersion: "TODO_FROM_META", appSecret: "app-secret" },
          loader,
        ),
    ).toThrow("FACEBOOK_GRAPH_API_VERSION");
  });

  it("validates empty, unsupported and mixed video payloads", async () => {
    const base = {
      scheduledPublicationId: "schedule",
      publicationId: "publication",
      publicationVersion: 1,
      pageId: "1234567890",
      accessToken: "page-token",
      idempotencyKey: "key",
    };
    expect(
      await adapter.validate({ ...base, text: "", media: [] }),
    ).toMatchObject({
      valid: false,
    });
    expect(
      await adapter.validate({
        ...base,
        text: "Fichier",
        media: [
          {
            storageKey: "private/file.pdf",
            mimeType: "application/pdf",
            checksum: "pdf",
            position: 0,
          },
        ],
      }),
    ).toMatchObject({ valid: false });
    expect(
      await adapter.validate({
        ...base,
        text: "Vidéo",
        media: [
          {
            storageKey: "private/video.mp4",
            mimeType: "video/mp4",
            checksum: "video",
            position: 0,
          },
          {
            storageKey: "private/image.jpg",
            mimeType: "image/jpeg",
            checksum: "image",
            position: 1,
          },
        ],
      }),
    ).toMatchObject({ valid: false });
  });

  it("normalizes 429, 5xx, token and permission errors", () => {
    expect(adapter.normalizeError(new FacebookApiError(429, 4)).category).toBe(
      "rate_limit",
    );
    expect(adapter.normalizeError(new FacebookApiError(503, 2)).category).toBe(
      "server",
    );
    expect(
      adapter.normalizeError(new FacebookApiError(400, 190)).category,
    ).toBe("token_expired");
    expect(
      adapter.normalizeError(new FacebookApiError(400, 200)).category,
    ).toBe("permission");
    expect(adapter.normalizeError(new TypeError("fetch failed"))).toEqual({
      category: "server",
      code: "network_error",
      retryable: true,
    });
    expect(
      adapter.normalizeError(
        Object.assign(new Error("timeout"), { name: "AbortError" }),
      ),
    ).toMatchObject({ category: "timeout", retryable: true });
    expect(adapter.normalizeError(new Error("other"))).toMatchObject({
      category: "unknown",
      retryable: false,
    });
  });

  it("requires reconnection instead of inventing token refresh", async () => {
    await expect(adapter.refreshCredentials()).rejects.toThrow(
      "FacebookReauthorizationRequired",
    );
  });

  it("publishes text and normalizes the distant response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: "1234567890_42" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const result = await adapter.publish({
      scheduledPublicationId: "schedule",
      publicationId: "publication",
      publicationVersion: 1,
      pageId: "1234567890",
      accessToken: "page-token",
      text: "Bonjour",
      media: [],
      idempotencyKey: "key",
    });
    expect(result.remotePostId).toBe("1234567890_42");
    expect(result.rawCode).toBe("facebook_post_created");
  });

  it("uploads a private image before creating the Page post", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "photo-1" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "1234567890_43" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await adapter.publish({
      scheduledPublicationId: "schedule",
      publicationId: "publication",
      publicationVersion: 1,
      pageId: "1234567890",
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
    expect(result.remotePostId).toBe("1234567890_43");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uploads one private video and uses the returned remote id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: "video-remote-1" }), {
          status: 200,
        }),
      ),
    );
    const result = await adapter.publish({
      scheduledPublicationId: "schedule",
      publicationId: "publication",
      publicationVersion: 1,
      pageId: "1234567890",
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
    expect(result.remotePostId).toBe("video-remote-1");
  });

  it("normalizes an error response and a missing remote id", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 4 } }), { status: 429 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const input = {
      scheduledPublicationId: "schedule",
      publicationId: "publication",
      publicationVersion: 1,
      pageId: "1234567890",
      accessToken: "page-token",
      text: "Bonjour",
      media: [],
      idempotencyKey: "key-error",
    };
    await expect(adapter.publish(input)).rejects.toMatchObject({
      httpStatus: 429,
    });
    await expect(adapter.publish(input)).rejects.toMatchObject({
      code: "missing_remote_id",
    });
  });

  it("keeps mock publication and error handling idempotent", async () => {
    const mock = new MockFacebookPublisher();
    const input = {
      scheduledPublicationId: "schedule",
      publicationId: "publication",
      publicationVersion: 1,
      pageId: "page",
      accessToken: "token",
      text: "Bonjour",
      media: [],
      idempotencyKey: "same-key",
    };
    expect((await mock.publish(input)).remotePostId).toBe(
      (await mock.publish(input)).remotePostId,
    );
    const normalized = {
      category: "server",
      code: "503",
      retryable: true,
    } as const;
    expect(mock.normalizeError({ normalized })).toEqual(normalized);
    expect(mock.normalizeError(new Error("unknown"))).toMatchObject({
      category: "unknown",
    });
    await expect(mock.refreshCredentials()).resolves.toBeUndefined();
  });
});
