import { UnrecoverableError } from "bullmq";
import { createHash } from "node:crypto";
import type { TikTokPublisherContract } from "./tiktok_adapter.js";
import type {
  ScheduledTikTokPublication,
  SocialPublicationRepository,
  SocialPublishError,
  TikTokJobContract,
} from "./types.js";

export type TikTokProcessorDependencies = {
  repository: SocialPublicationRepository;
  publisher: TikTokPublisherContract;
  decryptToken: (token: string) => string;
  now?: () => Date;
};

export function socialBackoffDelay(attemptsMade: number, type?: string) {
  if (type !== "wepost-social") return -1;
  return [60_000, 300_000, 900_000][attemptsMade - 1] ?? -1;
}

export function tiktokPayloadHash(input: {
  video: Record<string, unknown>;
  media: Array<{
    storageKey: string;
    mimeType: string;
    checksum: string;
    position: number;
    sizeBytes?: number;
  }>;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        video: input.video,
        media: input.media.map(
          ({ storageKey, mimeType, checksum, position, sizeBytes }) => ({
            storageKey,
            mimeType,
            checksum,
            position,
            sizeBytes: sizeBytes ?? 0,
          }),
        ),
      }),
    )
    .digest("hex");
}

const permanent = (
  category: SocialPublishError["category"],
  code: string,
): SocialPublishError => ({ category, code, retryable: false });

export async function processTikTokPublication(
  job: TikTokJobContract,
  dependencies: TikTokProcessorDependencies,
) {
  const startedAt = Date.now();
  const found = await dependencies.repository.findForPublish(
    job.data.scheduledPublicationId,
  );
  if (!found) throw new UnrecoverableError("scheduled_publication_not_found");
  const record = found as ScheduledTikTokPublication;
  if (record.remotePostId) {
    await dependencies.repository.ensurePublished(
      record.id,
      record.remotePostId,
    );
    return {
      skipped: true,
      remotePostId: record.remotePostId,
      durationMs: Date.now() - startedAt,
    };
  }
  const claimed = await dependencies.repository.beginAttempt(record.id);
  if (claimed.remotePostId) {
    await dependencies.repository.ensurePublished(
      record.id,
      claimed.remotePostId,
    );
    return {
      skipped: true,
      remotePostId: claimed.remotePostId,
      durationMs: Date.now() - startedAt,
    };
  }
  const attempt = claimed.attempt;
  const maxAttempts = job.opts.attempts ?? 1;
  try {
    const video = record.networkPayload ?? {};
    if (
      record.currentVersion !== record.publicationVersion ||
      record.approvedVersion !== record.publicationVersion ||
      !["scheduled", "publishing"].includes(record.publicationStatus) ||
      tiktokPayloadHash({ video, media: record.media }) !== record.payloadHash
    ) {
      throw {
        normalized: permanent("version_mismatch", "approved_version_changed"),
      };
    }
    if (
      record.accountStatus !== "connected" ||
      !record.encryptedAccessToken ||
      (record.accountExpiresAt &&
        record.accountExpiresAt <= (dependencies.now?.() ?? new Date()))
    ) {
      throw {
        normalized: permanent("token_expired", "reauthorization_required"),
      };
    }
    const accessToken = dependencies.decryptToken(record.encryptedAccessToken);
    const input = {
      scheduledPublicationId: record.id,
      publicationId: record.publicationId,
      publicationVersion: record.publicationVersion,
      pageId: record.externalAccountId,
      accessToken,
      text: record.text,
      media: record.media,
      idempotencyKey: record.idempotencyKey,
      networkPayload: video,
    };
    const validation = await dependencies.publisher.validate(input);
    if (!validation.valid) {
      throw { normalized: permanent("invalid_content", "validation_failed") };
    }
    let publishId = record.providerJobId;
    if (!publishId) {
      if (!dependencies.repository.markProviderJob)
        throw new Error("provider_tracking_unavailable");
      publishId = (
        await dependencies.publisher.start(input, async (initializedId) => {
          await dependencies.repository.markProviderJob!(
            record.id,
            initializedId,
            "PROCESSING_UPLOAD",
          );
        })
      ).publishId;
      record.providerJobId = publishId;
    }
    const remote = await dependencies.publisher.fetchStatus(
      accessToken,
      publishId,
    );
    await dependencies.repository.markProviderJob?.(
      record.id,
      publishId,
      remote.code,
    );
    if (remote.state === "pending") {
      throw {
        normalized: {
          category: "server",
          code: "processing_pending",
          retryable: true,
        } satisfies SocialPublishError,
      };
    }
    if (remote.state === "failed") {
      throw {
        normalized: permanent(
          "invalid_content",
          remote.failReason ?? "remote_failed",
        ),
      };
    }
    const result = {
      remotePostId: publishId,
      publishedAt: new Date().toISOString(),
      rawCode: remote.code,
    };
    await dependencies.repository.markPublished(record.id, attempt, result);
    return {
      skipped: false,
      remotePostId: publishId,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    const normalized =
      error && typeof error === "object" && "normalized" in error
        ? (error as { normalized: SocialPublishError }).normalized
        : dependencies.publisher.normalizeError(error);
    const final = !normalized.retryable || job.attemptsMade + 1 >= maxAttempts;
    await dependencies.repository.markAttemptFailed(
      record.id,
      attempt,
      normalized,
      final,
    );
    if (normalized.category === "token_expired") {
      await dependencies.repository.markAccountExpired(record.accountId);
    }
    if (!normalized.retryable)
      throw new UnrecoverableError(normalized.category);
    throw new Error(normalized.code);
  }
}
