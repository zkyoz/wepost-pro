export type TikTokCreatorInfo = {
  privacyLevelOptions: string[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec: number;
};
export type TikTokAccount = {
  id: string;
  agencyId: string;
  network: "tiktok";
  externalAccountId: string;
  externalAccountName: string;
  expiresAt: string | null;
  scopes: string[];
  status: "connected" | "expired" | "revoked" | "error";
  canRefresh: boolean;
  creatorInfo: TikTokCreatorInfo;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
};
export type TikTokVideoInput = {
  accountId: string;
  privacyLevel: string;
  caption: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  brandContentToggle: boolean;
  brandOrganicToggle: boolean;
  isAigc: boolean;
};
export type TikTokAttempt = {
  id: string;
  attempt: number;
  startedAt: string;
  finishedAt: string | null;
  result:
    | "started"
    | "success"
    | "transient_failure"
    | "permanent_failure"
    | "skipped";
  normalizedError: {
    category?: string;
    code?: string;
    retryable?: boolean;
  } | null;
  remotePostId: string | null;
};
export type TikTokSchedule = {
  id: string;
  publicationId: string;
  network: "tiktok";
  accountId: string;
  publicationVersion: number;
  runAt: string;
  status: "queued" | "publishing" | "published" | "failed" | "cancelled";
  video: Omit<TikTokVideoInput, "accountId">;
  providerJobId: string | null;
  providerStatus: string | null;
  attempts: TikTokAttempt[];
  createdAt: string;
  updatedAt: string;
};
export type TikTokValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};
