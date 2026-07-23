import { createHmac } from "node:crypto";
import type { MediaLoader } from "./media_loader.js";
import type {
  PublishInput,
  PublishResult,
  SocialPublisher,
  SocialPublishError,
} from "./types.js";

export class FacebookApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly code: number | string,
    public readonly subcode?: number | string,
  ) {
    super("FacebookApiError");
    this.name = "FacebookApiError";
  }
}

export class ReauthorizationRequiredError extends Error {
  constructor() {
    super("FacebookReauthorizationRequired");
    this.name = "ReauthorizationRequiredError";
  }
}

type FacebookAdapterConfig = {
  graphApiVersion: string;
  appSecret: string;
  timeoutMs?: number;
};

export class FacebookPublisher implements SocialPublisher {
  constructor(
    private readonly config: FacebookAdapterConfig,
    private readonly mediaLoader: MediaLoader,
  ) {
    if (!config.graphApiVersion || config.graphApiVersion.startsWith("TODO_")) {
      throw new Error("FACEBOOK_GRAPH_API_VERSION doit être configurée.");
    }
  }

  async validate(input: PublishInput) {
    const errors: string[] = [];
    if (!input.text.trim() && input.media.length === 0)
      errors.push("Publication Facebook vide.");
    const videos = input.media.filter(
      (media) => media.mimeType === "video/mp4",
    );
    if (videos.length > 1 || (videos.length && input.media.length > 1)) {
      errors.push("Une publication vidéo ne peut contenir qu’une vidéo.");
    }
    if (
      input.media.some(
        (media) =>
          !["image/jpeg", "image/png", "image/gif", "video/mp4"].includes(
            media.mimeType,
          ),
      )
    ) {
      errors.push("Format de média Facebook non pris en charge.");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const video = input.media.find((media) => media.mimeType === "video/mp4");
    let remotePostId: string;
    if (video) {
      remotePostId = await this.publishVideo(input, video);
    } else if (input.media.length) {
      const mediaIds: string[] = [];
      for (const media of input.media)
        mediaIds.push(await this.uploadPhoto(input, media));
      const fields: Record<string, string> = { message: input.text };
      mediaIds.forEach((id, index) => {
        fields[`attached_media[${index}]`] = JSON.stringify({ media_fbid: id });
      });
      remotePostId = await this.graphPost(
        `${input.pageId}/feed`,
        input.accessToken,
        fields,
      );
    } else {
      remotePostId = await this.graphPost(
        `${input.pageId}/feed`,
        input.accessToken,
        {
          message: input.text,
        },
      );
    }
    return {
      remotePostId,
      publishedAt: new Date().toISOString(),
      rawCode: "facebook_post_created",
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
    if (error instanceof FacebookApiError) {
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

  private async uploadPhoto(
    input: PublishInput,
    media: PublishInput["media"][number],
  ) {
    const body = new FormData();
    body.set("published", "false");
    body.set(
      "source",
      new Blob(
        [Uint8Array.from(await this.mediaLoader.load(media.storageKey))],
        {
          type: media.mimeType,
        },
      ),
      "media",
    );
    return this.graphPost(
      `${input.pageId}/photos`,
      input.accessToken,
      {},
      body,
    );
  }

  private async publishVideo(
    input: PublishInput,
    media: PublishInput["media"][number],
  ) {
    const body = new FormData();
    body.set("description", input.text);
    body.set(
      "source",
      new Blob(
        [Uint8Array.from(await this.mediaLoader.load(media.storageKey))],
        {
          type: media.mimeType,
        },
      ),
      "video.mp4",
    );
    return this.graphPost(
      `${input.pageId}/videos`,
      input.accessToken,
      {},
      body,
    );
  }

  private async graphPost(
    path: string,
    accessToken: string,
    fields: Record<string, string>,
    multipart?: FormData,
  ) {
    const body = multipart ?? new FormData();
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
      post_id?: string;
      error?: { code?: number; error_subcode?: number };
    };
    if (!response.ok || result.error) {
      throw new FacebookApiError(
        response.status,
        result.error?.code ?? response.status,
        result.error?.error_subcode,
      );
    }
    const id = result.post_id ?? result.id;
    if (!id) throw new FacebookApiError(502, "missing_remote_id");
    return id;
  }
}

export class MockFacebookPublisher implements SocialPublisher {
  readonly published = new Map<string, string>();
  calls = 0;

  async validate() {
    return { valid: true, errors: [], warnings: [] };
  }
  async publish(input: PublishInput): Promise<PublishResult> {
    this.calls += 1;
    const remotePostId =
      this.published.get(input.idempotencyKey) ??
      `mock-facebook-${this.published.size + 1}`;
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
