import { createHmac } from "node:crypto";
import type { MediaUrlProvider } from "./media_url_provider.js";
import type {
  PublishInput,
  PublishResult,
  SocialPublisher,
  SocialPublishError,
} from "./types.js";

export class InstagramApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly code: number | string,
    public readonly subcode?: number | string,
  ) {
    super("InstagramApiError");
    this.name = "InstagramApiError";
  }
}

export class ReauthorizationRequiredError extends Error {
  constructor() {
    super("InstagramReauthorizationRequired");
    this.name = "ReauthorizationRequiredError";
  }
}

type InstagramAdapterConfig = {
  graphApiVersion: string;
  appSecret: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
};

export class InstagramPublisher implements SocialPublisher {
  constructor(
    private readonly config: InstagramAdapterConfig,
    private readonly mediaUrls: MediaUrlProvider,
  ) {
    if (!config.graphApiVersion || config.graphApiVersion.startsWith("TODO_")) {
      throw new Error("INSTAGRAM_GRAPH_API_VERSION doit être configurée.");
    }
  }

  async validate(input: PublishInput) {
    const errors: string[] = [];
    if (input.media.length !== 1) {
      errors.push("Une image JPEG ou une vidéo MP4 est obligatoire.");
    }
    if (
      input.media.some(
        (media) => !["image/jpeg", "video/mp4"].includes(media.mimeType),
      )
    ) {
      errors.push("Format Instagram non pris en charge.");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const media = input.media[0];
    if (!media) throw new InstagramApiError(400, "media_required");
    const mediaUrl = await this.mediaUrls.sign(media.storageKey, 1200);
    const fields: Record<string, string> = { caption: input.text };
    if (media.mimeType === "video/mp4") {
      fields.media_type = "REELS";
      fields.video_url = mediaUrl;
    } else {
      fields.image_url = mediaUrl;
    }
    const containerId = await this.graphPost(
      `${input.pageId}/media`,
      input.accessToken,
      fields,
    );
    await this.waitUntilReady(containerId, input.accessToken);
    const remotePostId = await this.graphPost(
      `${input.pageId}/media_publish`,
      input.accessToken,
      { creation_id: containerId },
    );
    return {
      remotePostId,
      publishedAt: new Date().toISOString(),
      rawCode: "instagram_media_published",
    };
  }

  async refreshCredentials() {
    throw new ReauthorizationRequiredError();
  }

  normalizeError(error: unknown): SocialPublishError {
    if (error instanceof ReauthorizationRequiredError) {
      return {
        category: "token_expired",
        code: "reauthorization_required",
        retryable: false,
      };
    }
    if (error instanceof InstagramApiError) {
      const code = String(error.subcode ?? error.code);
      if (error.httpStatus === 429 || String(error.code) === "4") {
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
      if (String(error.code) === "190") {
        return {
          category: "token_expired",
          code,
          retryable: false,
          httpStatus: error.httpStatus,
        };
      }
      if (["10", "200"].includes(String(error.code))) {
        return {
          category: "permission",
          code,
          retryable: false,
          httpStatus: error.httpStatus,
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

  private appSecretProof(accessToken: string) {
    return createHmac("sha256", this.config.appSecret)
      .update(accessToken)
      .digest("hex");
  }

  private async waitUntilReady(containerId: string, accessToken: string) {
    const attempts = this.config.maxPollAttempts ?? 30;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const status = await this.graphGet(containerId, accessToken);
      if (status === "FINISHED") return;
      if (["ERROR", "EXPIRED"].includes(status)) {
        throw new InstagramApiError(400, `container_${status.toLowerCase()}`);
      }
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.pollIntervalMs ?? 2000),
      );
    }
    const timeout = new Error("InstagramContainerTimeout");
    timeout.name = "TimeoutError";
    throw timeout;
  }

  private async graphGet(path: string, accessToken: string) {
    const query = new URLSearchParams({
      fields: "status_code,status",
      appsecret_proof: this.appSecretProof(accessToken),
    });
    const response = await fetch(
      `https://graph.facebook.com/${this.config.graphApiVersion}/${path}?${query}`,
      {
        headers: { authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 30_000),
      },
    );
    const result = (await response.json()) as {
      status_code?: string;
      error?: { code?: number; error_subcode?: number };
    };
    if (!response.ok || result.error) {
      throw new InstagramApiError(
        response.status,
        result.error?.code ?? response.status,
        result.error?.error_subcode,
      );
    }
    return result.status_code ?? "IN_PROGRESS";
  }

  private async graphPost(
    path: string,
    accessToken: string,
    fields: Record<string, string>,
  ) {
    const body = new FormData();
    Object.entries(fields).forEach(([key, value]) => body.set(key, value));
    body.set("appsecret_proof", this.appSecretProof(accessToken));
    const response = await fetch(
      `https://graph.facebook.com/${this.config.graphApiVersion}/${path}`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}` },
        body,
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 30_000),
      },
    );
    const result = (await response.json()) as {
      id?: string;
      error?: { code?: number; error_subcode?: number };
    };
    if (!response.ok || result.error) {
      throw new InstagramApiError(
        response.status,
        result.error?.code ?? response.status,
        result.error?.error_subcode,
      );
    }
    if (!result.id) throw new InstagramApiError(502, "missing_remote_id");
    return result.id;
  }
}

export class MockInstagramPublisher implements SocialPublisher {
  readonly published = new Map<string, string>();
  readonly phases: string[] = [];
  calls = 0;

  async validate(input: PublishInput) {
    return {
      valid: input.media.length === 1,
      errors: input.media.length === 1 ? [] : ["media_required"],
      warnings: [],
    };
  }
  async publish(input: PublishInput): Promise<PublishResult> {
    this.calls += 1;
    this.phases.push(
      "container_created",
      "container_finished",
      "media_published",
    );
    const remotePostId =
      this.published.get(input.idempotencyKey) ??
      `mock-instagram-${this.published.size + 1}`;
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
