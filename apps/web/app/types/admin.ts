import type { PublicUser } from "~/types/auth";
import type { Project } from "~/types/project";
import type { Publication } from "~/types/publication";

export type AdminPageMeta = {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
};

export type AdminOverview = {
  users: { total: number; active: number };
  projects: { total: number; archived: number };
  publications: { total: number };
  socialAccounts: { active: number };
  incidents: { total: number };
};

export type SystemComponentStatus =
  "operational" | "degraded" | "down" | "disabled" | "unknown";

export type SystemStatus = {
  generatedAt: string;
  environment: string;
  release: string;
  overall: "ready" | "degraded" | "unavailable";
  components: Array<{
    id: string;
    label: string;
    status: SystemComponentStatus;
    message: string;
    latencyMs?: number;
  }>;
  queue: {
    waiting: number;
    active: number;
    failed: number;
    delayed: number;
    completed: number;
    failedJobs: Array<{
      id: string;
      name: string;
      attemptsMade: number;
      failedAt: string | null;
      failure: string;
    }>;
  };
  social: {
    drivers: Record<string, string>;
    accounts: Array<{ network: string; status: string; total: number }>;
    failures24h: number;
    status: SystemComponentStatus;
  };
  metrics: {
    http: {
      requestCount: number;
      errorCount: number;
      errorRate: number;
      p95LatencyMs: number | null;
      sampleSize: number;
    };
    process: {
      uptimeSeconds: number;
      memoryRssBytes: number;
      cpuUserMicroseconds: number;
    };
  };
};

export type BackupRun = {
  id: string;
  type: "database" | "restore_drill";
  status: "running" | "succeeded" | "failed";
  startedAt: string;
  completedAt: string | null;
  objectKey: string | null;
  checksum: string | null;
  sizeBytes: number | null;
  errorCode: string | null;
  retentionTier: "daily" | "weekly" | "monthly" | null;
  verifiedAt: string | null;
  restoredAt: string | null;
};

export type BackupSummary = {
  lastVerifiedAt: string | null;
  lastVerifiedAgeHours: number | null;
  lastValidAt: string | null;
  lastRestoreAt: string | null;
  successRate: number | null;
};

export type AdminSocialAccount = {
  id: string;
  agencyId: string;
  network: string;
  externalAccountName: string;
  externalAccountReference: string;
  scopes: string[];
  status: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
};

export type AdminIncident = {
  id: string;
  scheduledId: string;
  publicationId: string | null;
  publicationTitle: string;
  network: string | null;
  scheduleStatus: string | null;
  attempt: number;
  result: string;
  error: unknown;
  remotePostReference: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export type AdminAuditLog = {
  id: string;
  actorUserId: string | null;
  actorName: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  previousValues: unknown;
  nextValues: unknown;
  metadata: unknown;
  createdAt: string;
};

export type AdminResource =
  | PublicUser
  | Project
  | Publication
  | AdminSocialAccount
  | AdminIncident
  | AdminAuditLog;

export type AdminResourceName =
  "projects" | "publications" | "social-accounts" | "incidents" | "audit-logs";
