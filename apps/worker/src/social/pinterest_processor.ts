import { UnrecoverableError } from "bullmq";
import { createHash } from "node:crypto";
import type {
  PinterestJobContract,
  SocialPublicationRepository,
  SocialPublisher,
  SocialPublishError,
} from "./types.js";

export type PinterestProcessorDependencies = {
  repository: SocialPublicationRepository;
  publisher: SocialPublisher;
  decryptToken: (token: string) => string;
  now?: () => Date;
};

export function socialBackoffDelay(attemptsMade: number, type?: string) {
  if (type !== "wepost-social") return -1;
  return [60_000, 300_000, 900_000][attemptsMade - 1] ?? -1;
}

export function pinterestPayloadHash(input: {
  pin: {
    boardId: string;
    title: string;
    description: string;
    link: string | null;
  };
  media: Array<{
    storageKey: string;
    mimeType: string;
    checksum: string;
    position: number;
  }>;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        pin: input.pin,
        media: input.media.map(
          ({ storageKey, mimeType, checksum, position }) => ({
            storageKey,
            mimeType,
            checksum,
            position,
          }),
        ),
      }),
    )
    .digest("hex");
}

const permanent = (
  category: SocialPublishError["category"],
  code: string,
): SocialPublishError => ({
  category,
  code,
  retryable: false,
});

export async function processPinterestPublication(
  job: PinterestJobContract,
  dependencies: PinterestProcessorDependencies,
) {
  const startedAt = Date.now();
  const record = await dependencies.repository.findForPublish(
    job.data.scheduledPublicationId,
  );
  if (!record) throw new UnrecoverableError("scheduled_publication_not_found");
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
    const payload = record.networkPayload ?? {};
    const pin = {
      boardId: typeof payload.boardId === "string" ? payload.boardId : "",
      title: typeof payload.title === "string" ? payload.title : "",
      description:
        typeof payload.description === "string" ? payload.description : "",
      link:
        typeof payload.link === "string" && payload.link ? payload.link : null,
    };
    if (
      record.currentVersion !== record.publicationVersion ||
      record.approvedVersion !== record.publicationVersion ||
      !["scheduled", "publishing"].includes(record.publicationStatus) ||
      pinterestPayloadHash({ pin, media: record.media }) !== record.payloadHash
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
    const input = {
      scheduledPublicationId: record.id,
      publicationId: record.publicationId,
      publicationVersion: record.publicationVersion,
      pageId: record.externalAccountId,
      accessToken: dependencies.decryptToken(record.encryptedAccessToken),
      text: record.text,
      media: record.media,
      idempotencyKey: record.idempotencyKey,
      networkPayload: pin,
    };
    const validation = await dependencies.publisher.validate(input);
    if (!validation.valid) {
      throw { normalized: permanent("invalid_content", "validation_failed") };
    }
    const result = await dependencies.publisher.publish(input);
    await dependencies.repository.markPublished(record.id, attempt, result);
    return {
      skipped: false,
      remotePostId: result.remotePostId,
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
    throw error instanceof Error ? error : new Error(normalized.category);
  }
}
