import type { MediaLoader } from "./media_loader.js";
import type {
  PublishInput,
  PublishResult,
  SocialPublisher,
  SocialPublishError,
} from "./types.js";

export class LinkedInApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly code: number | string,
  ) {
    super("LinkedInApiError");
    this.name = "LinkedInApiError";
  }
}

type LinkedInAdapterConfig = {
  apiVersion: string;
  timeoutMs?: number;
};

export class LinkedInPublisher implements SocialPublisher {
  constructor(
    private readonly config: LinkedInAdapterConfig,
    private readonly mediaLoader: MediaLoader,
  ) {
    if (!config.apiVersion || config.apiVersion.startsWith("TODO_")) {
      throw new Error("LINKEDIN_API_VERSION doit être configurée.");
    }
  }

  async validate(input: PublishInput) {
    const errors: string[] = [];
    if (!input.text.trim()) errors.push("Le texte LinkedIn est obligatoire.");
    if (input.text.length > 3000)
      errors.push("Le texte LinkedIn dépasse 3 000 caractères.");
    if (input.media.length > 1)
      errors.push("Une seule image LinkedIn est prise en charge.");
    if (
      input.media.some(
        (media) => !["image/jpeg", "image/png"].includes(media.mimeType),
      )
    ) {
      errors.push("Format LinkedIn non pris en charge.");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const author = `urn:li:organization:${input.pageId}`;
    const media = input.media[0];
    const mediaUrn = media
      ? await this.uploadImage(author, input.accessToken, media)
      : null;
    const body: Record<string, unknown> = {
      author,
      commentary: input.text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };
    if (mediaUrn) body.content = { media: { id: mediaUrn } };
    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: this.headers(input.accessToken),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30_000),
    });
    if (!response.ok) throw await this.apiError(response);
    const remotePostId = response.headers.get("x-restli-id");
    if (!remotePostId) throw new LinkedInApiError(502, "missing_remote_id");
    return {
      remotePostId,
      publishedAt: new Date().toISOString(),
      rawCode: "linkedin_post_created",
    };
  }

  async refreshCredentials() {
    throw new LinkedInApiError(401, "reauthorization_required");
  }

  normalizeError(error: unknown): SocialPublishError {
    if (error instanceof LinkedInApiError) {
      const code = String(error.code);
      if (error.httpStatus === 429) {
        return {
          category: "rate_limit",
          code,
          retryable: true,
          httpStatus: error.httpStatus,
        };
      }
      if (error.httpStatus >= 500) {
        return {
          category: "server",
          code,
          retryable: true,
          httpStatus: error.httpStatus,
        };
      }
      if (error.httpStatus === 401) {
        return {
          category: "token_expired",
          code,
          retryable: false,
          httpStatus: 401,
        };
      }
      if (error.httpStatus === 403) {
        return {
          category: "permission",
          code,
          retryable: false,
          httpStatus: 403,
        };
      }
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
    ) {
      return { category: "timeout", code: error.name, retryable: true };
    }
    if (error instanceof TypeError) {
      return { category: "server", code: "network_error", retryable: true };
    }
    return { category: "unknown", code: "unknown", retryable: false };
  }

  private headers(token: string) {
    return {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "linkedin-version": this.config.apiVersion,
      "x-restli-protocol-version": "2.0.0",
    };
  }

  private async uploadImage(
    owner: string,
    token: string,
    media: PublishInput["media"][number],
  ) {
    const initialized = await fetch(
      "https://api.linkedin.com/rest/images?action=initializeUpload",
      {
        method: "POST",
        headers: this.headers(token),
        body: JSON.stringify({ initializeUploadRequest: { owner } }),
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 30_000),
      },
    );
    if (!initialized.ok) throw await this.apiError(initialized);
    const result = (await initialized.json()) as {
      value?: { uploadUrl?: string; image?: string };
    };
    if (!result.value?.uploadUrl || !result.value.image) {
      throw new LinkedInApiError(502, "invalid_upload_initialization");
    }
    const uploadUrl = new URL(result.value.uploadUrl);
    if (
      uploadUrl.protocol !== "https:" ||
      !/(^|\.)linkedin\.com$/.test(uploadUrl.hostname)
    ) {
      throw new LinkedInApiError(502, "invalid_upload_host");
    }
    const bytes = await this.mediaLoader.load(media.storageKey);
    const uploaded = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": media.mimeType,
      },
      body: Uint8Array.from(bytes),
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30_000),
    });
    if (!uploaded.ok) throw await this.apiError(uploaded);
    return result.value.image;
  }

  private async apiError(response: Response) {
    const body = (await response.json().catch(() => ({}))) as {
      status?: number;
      serviceErrorCode?: number;
      code?: string;
    };
    return new LinkedInApiError(
      response.status,
      body.serviceErrorCode ?? body.status ?? body.code ?? response.status,
    );
  }
}

export class MockLinkedInPublisher implements SocialPublisher {
  readonly published = new Map<string, string>();
  calls = 0;

  async validate(input: PublishInput) {
    const valid = Boolean(input.text.trim()) && input.media.length <= 1;
    return { valid, errors: valid ? [] : ["invalid_content"], warnings: [] };
  }
  async publish(input: PublishInput): Promise<PublishResult> {
    this.calls += 1;
    const remotePostId =
      this.published.get(input.idempotencyKey) ??
      `urn:li:share:mock-${this.published.size + 1}`;
    this.published.set(input.idempotencyKey, remotePostId);
    return {
      remotePostId,
      publishedAt: new Date().toISOString(),
      rawCode: "mock_created",
    };
  }
  async refreshCredentials() {}
  normalizeError(error: unknown): SocialPublishError {
    if (error && typeof error === "object" && "normalized" in error) {
      return (error as { normalized: SocialPublishError }).normalized;
    }
    return { category: "unknown", code: "mock_unknown", retryable: false };
  }
}
