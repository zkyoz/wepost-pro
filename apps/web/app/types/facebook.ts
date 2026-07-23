export type FacebookAccount = {
  id: string;
  agencyId: string;
  network: "facebook";
  externalAccountId: string;
  externalAccountName: string;
  expiresAt: string | null;
  scopes: string[];
  status: "connected" | "expired" | "revoked" | "error";
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
};

export type FacebookAttempt = {
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

export type FacebookSchedule = {
  id: string;
  publicationId: string;
  network: "facebook";
  accountId: string;
  publicationVersion: number;
  runAt: string;
  status: "queued" | "publishing" | "published" | "failed" | "cancelled";
  attempts: FacebookAttempt[];
  createdAt: string;
  updatedAt: string;
};

export type FacebookValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};
