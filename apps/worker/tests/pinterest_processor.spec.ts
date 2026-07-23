import { UnrecoverableError } from "bullmq";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MockPinterestPublisher,
  PinterestApiError,
  PinterestPublisher,
} from "../src/social/pinterest_adapter.js";
import { MockMediaUrlProvider } from "../src/social/media_url_provider.js";
import {
  pinterestPayloadHash,
  processPinterestPublication,
  socialBackoffDelay,
} from "../src/social/pinterest_processor.js";
import type {
  PublishResult,
  ScheduledPinterestPublication,
  SocialPublicationRepository,
  SocialPublishError,
} from "../src/social/types.js";

class MemoryRepository implements SocialPublicationRepository {
  attempt = 0;
  failures: Array<{ error: SocialPublishError; final: boolean }> = [];
  expired = false;
  published: PublishResult | null = null;
  constructor(
    public record: ScheduledPinterestPublication | null = validRecord(),
  ) {}
  async findForPublish() {
    return this.record;
  }
  async beginAttempt() {
    if (this.record?.remotePostId)
      return { attempt: 0, remotePostId: this.record.remotePostId };
    return { attempt: ++this.attempt, remotePostId: null };
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

function validRecord(): ScheduledPinterestPublication {
  const record: ScheduledPinterestPublication = {
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
    externalAccountId: "987654321",
    encryptedAccessToken: "encrypted-token",
    text: "Bonjour Pinterest",
    networkPayload: {
      boardId: "123456789",
      title: "Campagne",
      description: "Description",
      link: "https://wepost.pro",
    },
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
  record.payloadHash = pinterestPayloadHash({
    pin: record.networkPayload as {
      boardId: string;
      title: string;
      description: string;
      link: string | null;
    },
    media: record.media,
  });
  return record;
}
const job = (attemptsMade = 0) => ({
  data: { scheduledPublicationId: "schedule-1" },
  attemptsMade,
  opts: { attempts: 4 },
});
class FailingPublisher extends MockPinterestPublisher {
  constructor(private readonly failure: SocialPublishError) {
    super();
  }
  override async publish(): Promise<PublishResult> {
    throw { normalized: this.failure };
  }
}

describe("Pinterest publication worker", () => {
  it("stops when the schedule is missing", async () => {
    await expect(
      processPinterestPublication(job(), {
        repository: new MemoryRepository(null),
        publisher: new MockPinterestPublisher(),
        decryptToken: () => "token",
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
  });
  it("publishes once and skips a duplicate execution", async () => {
    const repository = new MemoryRepository();
    const publisher = new MockPinterestPublisher();
    const deps = { repository, publisher, decryptToken: () => "token" };
    expect((await processPinterestPublication(job(), deps)).skipped).toBe(
      false,
    );
    expect((await processPinterestPublication(job(), deps)).skipped).toBe(true);
    expect(publisher.calls).toBe(1);
  });
  it.each(["timeout", "rate_limit", "server"] as const)(
    "retries a transient %s failure",
    async (category) => {
      const repository = new MemoryRepository();
      const publisher = new FailingPublisher({
        category,
        code: category,
        retryable: true,
      });
      await expect(
        processPinterestPublication(job(), {
          repository,
          publisher,
          decryptToken: () => "token",
        }),
      ).rejects.toThrow(category);
      expect(repository.failures[0]?.final).toBe(false);
    },
  );
  it("marks the last transient attempt final", async () => {
    const repository = new MemoryRepository();
    const publisher = new FailingPublisher({
      category: "server",
      code: "503",
      retryable: true,
    });
    await expect(
      processPinterestPublication(job(3), {
        repository,
        publisher,
        decryptToken: () => "token",
      }),
    ).rejects.toThrow("server");
    expect(repository.failures[0]?.final).toBe(true);
  });
  it("does not retry a permanent error", async () => {
    const repository = new MemoryRepository();
    const publisher = new FailingPublisher({
      category: "invalid_content",
      code: "400",
      retryable: false,
    });
    await expect(
      processPinterestPublication(job(), {
        repository,
        publisher,
        decryptToken: () => "token",
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
  });
  it("blocks a stale version or changed payload", async () => {
    for (const change of ["version", "payload"]) {
      const record = validRecord();
      if (change === "version") record.currentVersion = 3;
      else (record.networkPayload as Record<string, unknown>).title = "Modifié";
      const repository = new MemoryRepository(record);
      const publisher = new MockPinterestPublisher();
      await expect(
        processPinterestPublication(job(), {
          repository,
          publisher,
          decryptToken: () => "token",
        }),
      ).rejects.toBeInstanceOf(UnrecoverableError);
      expect(publisher.calls).toBe(0);
    }
  });
  it("marks an expired account", async () => {
    const record = validRecord();
    record.accountExpiresAt = new Date(0);
    const repository = new MemoryRepository(record);
    await expect(
      processPinterestPublication(job(), {
        repository,
        publisher: new MockPinterestPublisher(),
        decryptToken: () => "token",
        now: () => new Date(1),
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
    expect(repository.expired).toBe(true);
  });
  it("uses 1, 5 and 15 minute backoff", () => {
    expect(
      [1, 2, 3].map((attempt) => socialBackoffDelay(attempt, "wepost-social")),
    ).toEqual([60_000, 300_000, 900_000]);
  });
});

describe("Pinterest adapter", () => {
  const adapter = new PinterestPublisher(
    { apiBaseUrl: "https://api-sandbox.pinterest.com/v5", timeoutMs: 1000 },
    new MockMediaUrlProvider(),
  );
  const base = {
    scheduledPublicationId: "schedule",
    publicationId: "publication",
    publicationVersion: 1,
    pageId: "987654321",
    accessToken: "token",
    text: "Description",
    idempotencyKey: "key",
    networkPayload: {
      boardId: "123456789",
      title: "Campagne",
      description: "Description",
      link: "https://wepost.pro",
    },
    media: [
      {
        storageKey: "image.jpg",
        mimeType: "image/jpeg",
        checksum: "x",
        position: 0,
      },
    ],
  };
  afterEach(() => vi.unstubAllGlobals());
  it("rejects an API host outside the official Pinterest allowlist", () => {
    expect(
      () =>
        new PinterestPublisher(
          { apiBaseUrl: "https://example.test/v5" },
          new MockMediaUrlProvider(),
        ),
    ).toThrow("PINTEREST_API_BASE_URL invalide");
  });
  it("validates board, copy, link and exactly one image", async () => {
    expect(await adapter.validate(base)).toMatchObject({ valid: true });
    expect(await adapter.validate({ ...base, media: [] })).toMatchObject({
      valid: false,
    });
    expect(
      await adapter.validate({
        ...base,
        networkPayload: { ...base.networkPayload, link: "javascript:alert(1)" },
      }),
    ).toMatchObject({ valid: false });
    expect(
      await adapter.validate({
        ...base,
        networkPayload: {},
        media: [{ ...base.media[0]!, mimeType: "image/webp" }],
      }),
    ).toMatchObject({ valid: false });
  });
  it("creates a Pin with a server-signed image URL", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "pin-123", created_at: "2026-07-22T10:00:00Z" }),
          { status: 201 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    expect((await adapter.publish(base)).remotePostId).toBe("pin-123");
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api-sandbox.pinterest.com/v5/pins");
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      board_id: "123456789",
      media_source: { source_type: "image_url", is_standard: true },
    });
    expect(body.media_source.url).toContain("media.example.invalid");
  });
  it("rejects missing media, provider errors and missing remote identifiers", async () => {
    await expect(adapter.publish({ ...base, media: [] })).rejects.toMatchObject(
      {
        code: "image_required",
      },
    );
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ code: 3 }), { status: 400 }),
        ),
    );
    await expect(adapter.publish(base)).rejects.toMatchObject({
      httpStatus: 400,
      code: 3,
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 201 })),
    );
    await expect(adapter.publish(base)).rejects.toMatchObject({
      code: "missing_remote_id",
    });
    await expect(adapter.refreshCredentials()).rejects.toMatchObject({
      code: 2,
    });
  });
  it("normalizes provider errors", () => {
    expect(
      adapter.normalizeError(new PinterestApiError(429, 429)),
    ).toMatchObject({ category: "rate_limit", retryable: true });
    expect(
      adapter.normalizeError(new PinterestApiError(503, 503)),
    ).toMatchObject({ category: "server", retryable: true });
    expect(adapter.normalizeError(new PinterestApiError(401, 2))).toMatchObject(
      { category: "token_expired", retryable: false },
    );
    expect(
      adapter.normalizeError(new PinterestApiError(403, 403)),
    ).toMatchObject({ category: "permission", retryable: false });
    expect(
      adapter.normalizeError(new PinterestApiError(400, "invalid")),
    ).toMatchObject({ category: "invalid_content", retryable: false });
    const timeout = new Error("timeout");
    timeout.name = "AbortError";
    expect(adapter.normalizeError(timeout)).toMatchObject({
      category: "timeout",
      retryable: true,
    });
    expect(adapter.normalizeError(new TypeError("network"))).toMatchObject({
      category: "server",
      retryable: true,
    });
    expect(adapter.normalizeError(null)).toMatchObject({
      category: "unknown",
      retryable: false,
    });
  });
  it("keeps the mock idempotent", async () => {
    const mock = new MockPinterestPublisher();
    expect((await mock.publish(base)).remotePostId).toBe(
      (await mock.publish(base)).remotePostId,
    );
    expect(
      mock.normalizeError({
        normalized: { category: "permission", code: "403", retryable: false },
      }),
    ).toMatchObject({ category: "permission" });
    expect(mock.normalizeError(null)).toMatchObject({ category: "unknown" });
  });
});
