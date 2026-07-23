import type { MediaUrlProvider } from "./media_url_provider.js";
import type {
  PublishInput,
  PublishResult,
  SocialPublisher,
  SocialPublishError,
} from "./types.js";

export class PinterestApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly code: number | string,
  ) {
    super("PinterestApiError");
    this.name = "PinterestApiError";
  }
}

type PinterestPin = {
  boardId: string;
  title: string;
  description: string;
  link: string | null;
};
type PinterestAdapterConfig = { apiBaseUrl: string; timeoutMs?: number };

function pinFrom(input: PublishInput): PinterestPin {
  const value = input.networkPayload ?? {};
  return {
    boardId: typeof value.boardId === "string" ? value.boardId : "",
    title: typeof value.title === "string" ? value.title : "",
    description: typeof value.description === "string" ? value.description : "",
    link: typeof value.link === "string" && value.link ? value.link : null,
  };
}

export class PinterestPublisher implements SocialPublisher {
  constructor(
    private readonly config: PinterestAdapterConfig,
    private readonly mediaUrls: MediaUrlProvider,
  ) {
    if (
      !/^https:\/\/api(?:-sandbox)?\.pinterest\.com\/v5$/.test(
        config.apiBaseUrl,
      )
    ) {
      throw new Error("PINTEREST_API_BASE_URL invalide.");
    }
  }
  async validate(input: PublishInput) {
    const pin = pinFrom(input);
    const errors: string[] = [];
    if (!/^\d{5,30}$/.test(pin.boardId))
      errors.push("Tableau Pinterest invalide.");
    if (!pin.title.trim() || pin.title.length > 100)
      errors.push("Titre Pinterest invalide.");
    if (!pin.description.trim() || pin.description.length > 800)
      errors.push("Description Pinterest invalide.");
    if (pin.link) {
      try {
        const url = new URL(pin.link);
        if (!["http:", "https:"].includes(url.protocol))
          throw new Error("invalid_protocol");
      } catch {
        errors.push("Lien Pinterest invalide.");
      }
    }
    if (input.media.length !== 1)
      errors.push("Un Pin doit contenir exactement une image.");
    if (
      input.media.some(
        (media) => !["image/jpeg", "image/png"].includes(media.mimeType),
      )
    )
      errors.push("Format Pinterest non pris en charge.");
    return { valid: errors.length === 0, errors, warnings: [] };
  }
  async publish(input: PublishInput): Promise<PublishResult> {
    const pin = pinFrom(input);
    const media = input.media[0];
    if (!media) throw new PinterestApiError(400, "image_required");
    const imageUrl = await this.mediaUrls.sign(media.storageKey, 20 * 60);
    const response = await fetch(`${this.config.apiBaseUrl}/pins`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${input.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        board_id: pin.boardId,
        title: pin.title,
        description: pin.description,
        ...(pin.link ? { link: pin.link } : {}),
        media_source: {
          source_type: "image_url",
          url: imageUrl,
          is_standard: true,
        },
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30_000),
    });
    if (!response.ok) throw await this.apiError(response);
    const result = (await response.json()) as {
      id?: string;
      created_at?: string;
    };
    if (!result.id) throw new PinterestApiError(502, "missing_remote_id");
    return {
      remotePostId: result.id,
      publishedAt: result.created_at ?? new Date().toISOString(),
      rawCode: "pinterest_pin_created",
    };
  }
  async refreshCredentials() {
    throw new PinterestApiError(401, 2);
  }
  normalizeError(error: unknown): SocialPublishError {
    if (error instanceof PinterestApiError) {
      const code = String(error.code);
      if (error.httpStatus === 429)
        return {
          category: "rate_limit",
          code,
          retryable: true,
          httpStatus: 429,
        };
      if (error.httpStatus >= 500)
        return {
          category: "server",
          code,
          retryable: true,
          httpStatus: error.httpStatus,
        };
      if (error.httpStatus === 401 || code === "2")
        return {
          category: "token_expired",
          code,
          retryable: false,
          httpStatus: error.httpStatus,
        };
      if (error.httpStatus === 403)
        return {
          category: "permission",
          code,
          retryable: false,
          httpStatus: 403,
        };
      return {
        category: "invalid_content",
        code,
        retryable: false,
        httpStatus: error.httpStatus,
      };
    }
    if (
      error instanceof Error &&
      ["AbortError", "TimeoutError"].includes(error.name)
    )
      return { category: "timeout", code: error.name, retryable: true };
    if (error instanceof TypeError)
      return { category: "server", code: "network_error", retryable: true };
    return { category: "unknown", code: "unknown", retryable: false };
  }
  private async apiError(response: Response) {
    const body = (await response.json().catch(() => ({}))) as {
      code?: number | string;
    };
    return new PinterestApiError(response.status, body.code ?? response.status);
  }
}

export class MockPinterestPublisher implements SocialPublisher {
  readonly published = new Map<string, string>();
  calls = 0;
  async validate(input: PublishInput) {
    const valid = Boolean(pinFrom(input).boardId) && input.media.length === 1;
    return { valid, errors: valid ? [] : ["invalid_content"], warnings: [] };
  }
  async publish(input: PublishInput): Promise<PublishResult> {
    this.calls += 1;
    const remotePostId =
      this.published.get(input.idempotencyKey) ??
      `mock-pinterest-${this.published.size + 1}`;
    this.published.set(input.idempotencyKey, remotePostId);
    return {
      remotePostId,
      publishedAt: new Date().toISOString(),
      rawCode: "mock_created",
    };
  }
  async refreshCredentials() {}
  normalizeError(error: unknown): SocialPublishError {
    if (error && typeof error === "object" && "normalized" in error)
      return (error as { normalized: SocialPublishError }).normalized;
    return { category: "unknown", code: "mock_unknown", retryable: false };
  }
}
