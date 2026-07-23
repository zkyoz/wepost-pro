import type { SocialNetwork } from "~/types/publication";

export type StatisticsFilters = {
  from: string;
  to: string;
  projectId?: string;
  network?: SocialNetwork | "";
};

export type StatisticsResult = {
  period: { from: string; to: string; timezone: "UTC" };
  filters: {
    projects: Array<{ id: string; name: string }>;
    projectId: string | null;
    network: SocialNetwork | null;
  };
  totals: {
    publications: number;
    successRate: number | null;
    meanApprovalHours: number | null;
    comments: number;
    corrections: number;
    mediaCount: number;
    mediaBytes: number;
  };
  byStatus: Array<{ key: string; count: number }>;
  byNetwork: Array<{ key: string; count: number }>;
  byProject: Array<{ id: string; label: string; count: number }>;
  remote: {
    available: false;
    value: null;
    label: "N/A";
    lastSyncedAt: null;
    reason: string;
  };
  generatedAt: string;
};
