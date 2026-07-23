import type { MediaLoader } from "./media_loader.js";
import type {
  PublishInput,
  PublishResult,
  SocialPublisher,
  SocialPublishError,
} from "./types.js";

export type TikTokRemoteStatus = {
  state: "pending" | "published" | "failed";
  code: string;
  failReason?: string;
};

export interface TikTokPublisherContract extends SocialPublisher {
  start(
    input: PublishInput,
    onInitialized?: (publishId: string) => Promise<void>,
  ): Promise<{ publishId: string }>;
  fetchStatus(
    accessToken: string,
    publishId: string,
  ): Promise<TikTokRemoteStatus>;
}

export class TikTokApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly code: string,
  ) {
    super("TikTokApiError");
    this.name = "TikTokApiError";
  }
}

type TikTokVideo = {
  privacyLevel: string;
  caption: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  brandContentToggle: boolean;
  brandOrganicToggle: boolean;
  isAigc: boolean;
};

function videoFrom(input: PublishInput): TikTokVideo {
  const value = input.networkPayload ?? {};
  return {
    privacyLevel:
      typeof value.privacyLevel === "string" ? value.privacyLevel : "",
    caption: typeof value.caption === "string" ? value.caption : "",
    disableComment: value.disableComment === true,
    disableDuet: value.disableDuet === true,
    disableStitch: value.disableStitch === true,
    brandContentToggle: value.brandContentToggle === true,
    brandOrganicToggle: value.brandOrganicToggle === true,
    isAigc: value.isAigc === true,
  };
}

function uploadUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".tiktokapis.com")) {
    throw new TikTokApiError(502, "untrusted_upload_url");
  }
  return url;
}

export class TikTokPublisher implements TikTokPublisherContract {
  constructor(
    private readonly config: { apiBaseUrl: string; timeoutMs?: number },
    private readonly mediaLoader: MediaLoader,
  ) {
    if (config.apiBaseUrl !== "https://open.tiktokapis.com") {
      throw new Error("TIKTOK_API_BASE_URL invalide.");
    }
  }

  async validate(input: PublishInput) {
    const video = videoFrom(input);
    const errors: string[] = [];
    if (!video.privacyLevel) errors.push("Confidentialité TikTok manquante.");
    if ([...video.caption].length > 2200)
      errors.push("Légende TikTok trop longue.");
    if (input.media.length !== 1) errors.push("Une vidéo TikTok est requise.");
    if (input.media.some((media) => media.mimeType !== "video/mp4")) {
      errors.push("Seules les vidéos MP4 sont prises en charge.");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  async start(
    input: PublishInput,
    onInitialized?: (publishId: string) => Promise<void>,
  ) {
    const media = input.media[0];
    if (!media) throw new TikTokApiError(400, "video_required");
    const video = videoFrom(input);
    const buffer = await this.mediaLoader.load(media.storageKey);
    if (!buffer.length) throw new TikTokApiError(400, "empty_video");
    const chunkSize = Math.min(buffer.length, 64 * 1024 * 1024);
    const totalChunkCount = Math.ceil(buffer.length / chunkSize);
    const response = await fetch(
      `${this.config.apiBaseUrl}/v2/post/publish/video/init/`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${input.accessToken}`,
          "content-type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          post_info: {
            title: video.caption,
            privacy_level: video.privacyLevel,
            disable_duet: video.disableDuet,
            disable_comment: video.disableComment,
            disable_stitch: video.disableStitch,
            brand_content_toggle: video.brandContentToggle,
            brand_organic_toggle: video.brandOrganicToggle,
            is_aigc: video.isAigc,
          },
          source_info: {
            source: "FILE_UPLOAD",
            video_size: buffer.length,
            chunk_size: chunkSize,
            total_chunk_count: totalChunkCount,
          },
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 30_000),
      },
    );
    const body = await this.readBody(response);
    if (!response.ok || body.error?.code !== "ok") {
      throw new TikTokApiError(
        response.status,
        body.error?.code ?? "init_failed",
      );
    }
    const publishId = body.data?.publish_id;
    const destination = body.data?.upload_url;
    if (!publishId || !destination)
      throw new TikTokApiError(502, "missing_upload_contract");
    await onInitialized?.(publishId);
    const target = uploadUrl(destination);
    for (let offset = 0; offset < buffer.length; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, buffer.length);
      const upload = await fetch(target, {
        method: "PUT",
        headers: {
          "content-type": "video/mp4",
          "content-length": String(end - offset),
          "content-range": `bytes ${offset}-${end - 1}/${buffer.length}`,
        },
        body: Uint8Array.from(buffer.subarray(offset, end)).buffer,
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 60_000),
      });
      if (![201, 206].includes(upload.status)) {
        throw new TikTokApiError(upload.status, "upload_failed");
      }
    }
    return { publishId };
  }

  async fetchStatus(
    accessToken: string,
    publishId: string,
  ): Promise<TikTokRemoteStatus> {
    const response = await fetch(
      `${this.config.apiBaseUrl}/v2/post/publish/status/fetch/`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({ publish_id: publishId }),
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 30_000),
      },
    );
    const body = await this.readBody(response);
    if (!response.ok || body.error?.code !== "ok") {
      throw new TikTokApiError(
        response.status,
        body.error?.code ?? "status_failed",
      );
    }
    const code = body.data?.status ?? "UNKNOWN";
    if (code === "PUBLISH_COMPLETE") return { state: "published", code };
    if (code === "FAILED") {
      return {
        state: "failed",
        code,
        failReason: body.data?.fail_reason ?? "remote_failed",
      };
    }
    return { state: "pending", code };
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const { publishId } = await this.start(input);
    const status = await this.fetchStatus(input.accessToken, publishId);
    if (status.state === "failed")
      throw new TikTokApiError(422, status.failReason ?? status.code);
    if (status.state === "pending")
      throw new TikTokApiError(503, "processing_pending");
    return {
      remotePostId: publishId,
      publishedAt: new Date().toISOString(),
      rawCode: status.code,
    };
  }

  async refreshCredentials() {
    throw new TikTokApiError(401, "access_token_invalid");
  }

  normalizeError(error: unknown): SocialPublishError {
    if (error instanceof TikTokApiError) {
      if (error.httpStatus === 429)
        return {
          category: "rate_limit",
          code: error.code,
          retryable: true,
          httpStatus: 429,
        };
      if (error.httpStatus >= 500)
        return {
          category: "server",
          code: error.code,
          retryable: true,
          httpStatus: error.httpStatus,
        };
      if (error.httpStatus === 401)
        return {
          category: "token_expired",
          code: error.code,
          retryable: false,
          httpStatus: 401,
        };
      if (error.httpStatus === 403)
        return {
          category: "permission",
          code: error.code,
          retryable: false,
          httpStatus: 403,
        };
      return {
        category: "invalid_content",
        code: error.code,
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
    if (error instanceof TypeError)
      return { category: "server", code: "network_error", retryable: true };
    return { category: "unknown", code: "unknown", retryable: false };
  }

  private async readBody(response: Response) {
    return (await response.json().catch(() => ({}))) as {
      data?: {
        publish_id?: string;
        upload_url?: string;
        status?: string;
        fail_reason?: string;
      };
      error?: { code?: string };
    };
  }
}

export class MockTikTokPublisher implements TikTokPublisherContract {
  readonly published = new Map<string, string>();
  readonly statusSequences = new Map<string, string[]>();
  calls = 0;

  async validate(input: PublishInput) {
    const valid =
      Boolean(videoFrom(input).privacyLevel) && input.media.length === 1;
    return { valid, errors: valid ? [] : ["invalid_content"], warnings: [] };
  }

  async start(
    input: PublishInput,
    onInitialized?: (publishId: string) => Promise<void>,
  ) {
    this.calls += 1;
    const publishId =
      this.published.get(input.idempotencyKey) ??
      `mock-tiktok-${this.published.size + 1}`;
    this.published.set(input.idempotencyKey, publishId);
    await onInitialized?.(publishId);
    if (!this.statusSequences.has(publishId)) {
      this.statusSequences.set(publishId, [
        "PROCESSING_UPLOAD",
        "PUBLISH_COMPLETE",
      ]);
    }
    return { publishId };
  }

  async fetchStatus(
    _accessToken: string,
    publishId: string,
  ): Promise<TikTokRemoteStatus> {
    const sequence = this.statusSequences.get(publishId) ?? [
      "PUBLISH_COMPLETE",
    ];
    const code = sequence.shift() ?? "PUBLISH_COMPLETE";
    this.statusSequences.set(publishId, sequence);
    if (code === "FAILED")
      return { state: "failed", code, failReason: "remote_failed" };
    return code === "PUBLISH_COMPLETE"
      ? { state: "published", code }
      : { state: "pending", code };
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const { publishId } = await this.start(input);
    return {
      remotePostId: publishId,
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
