export type LinkedInAccount = {
  id: string;
  agencyId: string;
  network: "linkedin";
  externalAccountId: string;
  externalAccountName: string;
  expiresAt: string | null;
  scopes: string[];
  status: "connected" | "expired" | "revoked" | "error";
  canRefresh: boolean;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
};

export type LinkedInAttempt = {
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

export type LinkedInSchedule = {
  id: string;
  publicationId: string;
  network: "linkedin";
  accountId: string;
  publicationVersion: number;
  runAt: string;
  status: "queued" | "publishing" | "published" | "failed" | "cancelled";
  attempts: LinkedInAttempt[];
  createdAt: string;
  updatedAt: string;
};

export type LinkedInValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};
