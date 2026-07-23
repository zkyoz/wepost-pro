export const PROJECT_STATUSES = ["active", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectMember = {
  id: string;
  displayName: string;
  email: string;
};

export type Project = {
  id: string;
  agencyId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  clientUserId: string;
  timezone: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  canAcceptPublications: boolean;
  members: ProjectMember[];
  history?: Array<{ action: string; createdAt: string }>;
};

export type ProjectClient = ProjectMember & { agencyId: string };

export type ProjectInput = {
  name: string;
  description: string;
  clientUserId: string;
  memberUserIds: string[];
  timezone: string;
};

export type ProjectListMeta = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  counts: { active: number; archived: number };
};
