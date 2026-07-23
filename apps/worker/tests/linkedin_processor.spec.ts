import { UnrecoverableError } from "bullmq";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LinkedInApiError,
  LinkedInPublisher,
  MockLinkedInPublisher,
} from "../src/social/linkedin_adapter.js";
import { MockMediaLoader } from "../src/social/media_loader.js";
import {
  linkedinPayloadHash,
  processLinkedInPublication,
  socialBackoffDelay,
} from "../src/social/linkedin_processor.js";
import type {
  PublishResult,
  ScheduledLinkedInPublication,
  SocialPublicationRepository,
  SocialPublishError,
} from "../src/social/types.js";

class MemoryRepository implements SocialPublicationRepository {
  attempt = 0;
  failures: Array<{ error: SocialPublishError; final: boolean }> = [];
  expired = false;
  published: PublishResult | null = null;

  constructor(
    public record: ScheduledLinkedInPublication | null = validRecord(),
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

function validRecord(): ScheduledLinkedInPublication {
  const record: ScheduledLinkedInPublication = {
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
    text: "Bonjour LinkedIn",
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
  record.payloadHash = linkedinPayloadHash({
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

class FailingPublisher extends MockLinkedInPublisher {
  constructor(private readonly failure: SocialPublishError) {
    super();
  }
  override async publish(): Promise<PublishResult> {
    throw { normalized: this.failure };
  }
}

describe("LinkedIn publication worker", () => {
  it("stops permanently when the schedule no longer exists", async () => {
    await expect(
      processLinkedInPublication(job(), {
        repository: new MemoryRepository(null),
        publisher: new MockLinkedInPublisher(),
        decryptToken: () => "page-token",
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
  });

  it("publishes once and skips a duplicate execution", async () => {
    const repository = new MemoryRepository();
    const publisher = new MockLinkedInPublisher();
    const dependencies = {
      repository,
      publisher,
      decryptToken: () => "page-token",
    };
    const first = await processLinkedInPublication(job(), dependencies);
    const second = await processLinkedInPublication(job(), dependencies);
    expect(first.skipped).toBe(false);
    expect(second.skipped).toBe(true);
    expect(publisher.calls).toBe(1);
    expect(repository.published?.remotePostId).toBe("urn:li:share:mock-1");
  });

  it.each([
    ["timeout", "TimeoutError"],
    ["rate_limit", "4"],
    ["server", "503"],
  ] as const)("retries a transient %s failure", async (category, code) => {
    const repository = new MemoryRepository();
    const publisher = new FailingPublisher({ category, code, retryable: true });
    await expect(
      processLinkedInPublication(job(), {
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
      processLinkedInPublication(job(3), {
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
      processLinkedInPublication(job(), {
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
    const publisher = new MockLinkedInPublisher();
    await expect(
      processLinkedInPublication(job(), {
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
    const publisher = new MockLinkedInPublisher();
    await expect(
      processLinkedInPublication(job(), {
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
      processLinkedInPublication(job(), {
        repository,
        publisher: new MockLinkedInPublisher(),
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

describe("LinkedIn adapter", () => {
  const media = new MockMediaLoader();
  const adapter = new LinkedInPublisher(
    { apiVersion: "202606", timeoutMs: 1000 },
    media,
  );

  afterEach(() => vi.unstubAllGlobals());

  const base = {
    scheduledPublicationId: "schedule",
    publicationId: "publication",
    publicationVersion: 1,
    pageId: "123456789",
    accessToken: "access-token",
    text: "Bonjour LinkedIn",
    idempotencyKey: "key",
  };

  it("validates text and the supported image scope", async () => {
    expect(await adapter.validate({ ...base, media: [] })).toMatchObject({
      valid: true,
    });
    expect(
      await adapter.validate({
        ...base,
        media: [
          {
            storageKey: "image.jpg",
            mimeType: "image/jpeg",
            checksum: "x",
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
            storageKey: "video.mp4",
            mimeType: "video/mp4",
            checksum: "x",
            position: 0,
          },
        ],
      }),
    ).toMatchObject({ valid: false });
    expect(
      await adapter.validate({ ...base, text: "x".repeat(3001), media: [] }),
    ).toMatchObject({
      valid: false,
    });
  });

  it("creates a text post with the required version headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 201,
        headers: { "x-restli-id": "urn:li:share:123" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = await adapter.publish({ ...base, media: [] });
    expect(result.remotePostId).toBe("urn:li:share:123");
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.linkedin.com/rest/posts");
    expect(options.headers["linkedin-version"]).toBe("202606");
    expect(JSON.parse(options.body).author).toBe(
      "urn:li:organization:123456789",
    );
  });

  it("initializes, uploads and attaches one private image", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: {
              uploadUrl: "https://www.linkedin.com/dms-uploads/image",
              image: "urn:li:image:abc",
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 201 }))
      .mockResolvedValueOnce(
        new Response(null, {
          status: 201,
          headers: { "x-restli-id": "urn:li:share:with-image" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await adapter.publish({
      ...base,
      media: [
        {
          storageKey: "image.jpg",
          mimeType: "image/jpeg",
          checksum: "x",
          position: 0,
        },
      ],
    });
    expect(result.remotePostId).toBe("urn:li:share:with-image");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const postBody = JSON.parse(fetchMock.mock.calls[2]![1].body);
    expect(postBody.content.media.id).toBe("urn:li:image:abc");
  });

  it("rejects an unexpected upload host", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            value: {
              uploadUrl: "https://attacker.example/upload",
              image: "urn:li:image:abc",
            },
          }),
          { status: 200 },
        ),
      ),
    );
    await expect(
      adapter.publish({
        ...base,
        media: [
          {
            storageKey: "image.jpg",
            mimeType: "image/jpeg",
            checksum: "x",
            position: 0,
          },
        ],
      }),
    ).rejects.toMatchObject({ code: "invalid_upload_host" });
  });

  it("normalizes LinkedIn failures", () => {
    expect(
      adapter.normalizeError(new LinkedInApiError(429, 429)),
    ).toMatchObject({
      category: "rate_limit",
      retryable: true,
    });
    expect(
      adapter.normalizeError(new LinkedInApiError(503, 503)),
    ).toMatchObject({
      category: "server",
      retryable: true,
    });
    expect(
      adapter.normalizeError(new LinkedInApiError(401, 401)),
    ).toMatchObject({
      category: "token_expired",
      retryable: false,
    });
    expect(
      adapter.normalizeError(new LinkedInApiError(403, 403)),
    ).toMatchObject({
      category: "permission",
      retryable: false,
    });
    expect(
      adapter.normalizeError(new LinkedInApiError(400, 400)),
    ).toMatchObject({
      category: "invalid_content",
      retryable: false,
    });
    expect(adapter.normalizeError(new TypeError("fetch failed"))).toMatchObject(
      {
        category: "server",
        retryable: true,
      },
    );
  });

  it("keeps the mock idempotent", async () => {
    const mock = new MockLinkedInPublisher();
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
  });
});
