export type PinterestAccount = {
  id: string;
  agencyId: string;
  network: "pinterest";
  externalAccountId: string;
  externalAccountName: string;
  expiresAt: string | null;
  scopes: string[];
  status: "connected" | "expired" | "revoked" | "error";
  canRefresh: boolean;
  boards: Array<{ id: string; name: string; privacy: string }>;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
};

export type PinterestAttempt = {
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

export type PinterestSchedule = {
  id: string;
  publicationId: string;
  network: "pinterest";
  accountId: string;
  publicationVersion: number;
  runAt: string;
  status: "queued" | "publishing" | "published" | "failed" | "cancelled";
  pin: PinterestPinInput;
  attempts: PinterestAttempt[];
  createdAt: string;
  updatedAt: string;
};

export type PinterestPinInput = {
  accountId: string;
  boardId: string;
  title: string;
  description: string;
  link: string | null;
};

export type PinterestValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};
