import type { Job } from "bullmq";

export type FacebookPublicationJob = { scheduledPublicationId: string };
export type InstagramPublicationJob = { scheduledPublicationId: string };
export type LinkedInPublicationJob = { scheduledPublicationId: string };
export type PinterestPublicationJob = { scheduledPublicationId: string };
export type TikTokPublicationJob = { scheduledPublicationId: string };

export type PublishMedia = {
  storageKey: string;
  mimeType: string;
  checksum: string;
  position: number;
  sizeBytes?: number;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
};

export type PublishInput = {
  scheduledPublicationId: string;
  publicationId: string;
  publicationVersion: number;
  pageId: string;
  accessToken: string;
  text: string;
  media: PublishMedia[];
  idempotencyKey: string;
  networkPayload?: Record<string, unknown>;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};
export type PublishResult = {
  remotePostId: string;
  publishedAt: string;
  rawCode: string;
};
export type SocialPublishError = {
  category:
    | "timeout"
    | "rate_limit"
    | "server"
    | "token_expired"
    | "permission"
    | "invalid_content"
    | "version_mismatch"
    | "unknown";
  code: string;
  retryable: boolean;
  httpStatus?: number;
};

export interface SocialPublisher {
  validate(input: PublishInput): Promise<ValidationResult>;
  publish(input: PublishInput): Promise<PublishResult>;
  refreshCredentials(accountId: string): Promise<void>;
  normalizeError(error: unknown): SocialPublishError;
}

export type ScheduledFacebookPublication = {
  id: string;
  publicationId: string;
  publicationVersion: number;
  currentVersion: number;
  approvedVersion: number | null;
  publicationStatus: string;
  idempotencyKey: string;
  payloadHash: string;
  accountId: string;
  accountStatus: string;
  accountExpiresAt: Date | null;
  externalAccountId: string;
  encryptedAccessToken: string | null;
  text: string;
  media: PublishMedia[];
  remotePostId: string | null;
  networkPayload?: Record<string, unknown>;
};

export type ScheduledInstagramPublication = ScheduledFacebookPublication;
export type ScheduledLinkedInPublication = ScheduledFacebookPublication;
export type ScheduledPinterestPublication = ScheduledFacebookPublication;
export type ScheduledTikTokPublication = ScheduledFacebookPublication & {
  providerJobId: string | null;
  providerStatus: string | null;
};

export interface SocialPublicationRepository {
  findForPublish(
    id: string,
  ): Promise<ScheduledFacebookPublication | ScheduledTikTokPublication | null>;
  beginAttempt(
    id: string,
  ): Promise<{ attempt: number; remotePostId: string | null }>;
  ensurePublished(id: string, remotePostId: string): Promise<void>;
  markPublished(
    id: string,
    attempt: number,
    result: PublishResult,
  ): Promise<void>;
  markAttemptFailed(
    id: string,
    attempt: number,
    error: SocialPublishError,
    final: boolean,
  ): Promise<void>;
  markAccountExpired(accountId: string): Promise<void>;
  markProviderJob?(
    id: string,
    providerJobId: string,
    providerStatus: string,
  ): Promise<void>;
}

export type FacebookJobContract = Pick<
  Job<FacebookPublicationJob>,
  "data" | "attemptsMade" | "opts"
>;

export type InstagramJobContract = Pick<
  Job<InstagramPublicationJob>,
  "data" | "attemptsMade" | "opts"
>;

export type LinkedInJobContract = Pick<
  Job<LinkedInPublicationJob>,
  "data" | "attemptsMade" | "opts"
>;

export type PinterestJobContract = Pick<
  Job<PinterestPublicationJob>,
  "data" | "attemptsMade" | "opts"
>;

export type TikTokJobContract = Pick<
  Job<TikTokPublicationJob>,
  "data" | "attemptsMade" | "opts"
>;
