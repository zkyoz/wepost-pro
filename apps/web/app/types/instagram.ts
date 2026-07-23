export type InstagramAccount = {
  id: string;
  agencyId: string;
  network: "instagram";
  externalAccountId: string;
  externalAccountName: string;
  expiresAt: string | null;
  scopes: string[];
  status: "connected" | "expired" | "revoked" | "error";
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
};

export type InstagramAttempt = {
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

export type InstagramSchedule = {
  id: string;
  publicationId: string;
  network: "instagram";
  accountId: string;
  publicationVersion: number;
  runAt: string;
  status: "queued" | "publishing" | "published" | "failed" | "cancelled";
  attempts: InstagramAttempt[];
  createdAt: string;
  updatedAt: string;
};

export type InstagramValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};
