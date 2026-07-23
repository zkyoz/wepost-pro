export const PUBLICATION_STATUSES = [
  "draft",
  "in_progress",
  "awaiting_client_review",
  "changes_requested",
  "approved",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "archived",
] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  awaiting_client_review: "En attente de validation client",
  changes_requested: "Corrections demandées",
  approved: "Approuvée",
  scheduled: "Programmée",
  publishing: "Publication en cours",
  published: "Publiée",
  failed: "Échec",
  archived: "Archivée",
};

export const SOCIAL_NETWORKS = [
  "facebook",
  "instagram",
  "linkedin",
  "pinterest",
  "tiktok",
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export type PublicationInput = {
  title: string;
  baseText: string;
  targetNetworks: SocialNetwork[];
  scheduledAt: string | null;
  timezone: string;
};

export type Publication = PublicationInput & {
  id: string;
  agencyId: string;
  projectId: string;
  status: PublicationStatus;
  contentVersion: number;
  approvedVersion: number | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  versions?: Array<{
    version: number;
    snapshot: PublicationInput & { status: PublicationStatus };
    authorId: string;
    createdAt: string;
  }>;
};

export type PublicationListMeta = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};
