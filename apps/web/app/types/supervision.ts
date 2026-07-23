import type { PublicationStatus, SocialNetwork } from "~/types/publication";

export const SUPERVISION_CATEGORIES = [
  "unread_comments",
  "awaiting_client_review",
  "changes_requested",
  "scheduled",
  "published",
  "failed",
] as const;

export type SupervisionCategory = (typeof SUPERVISION_CATEGORIES)[number];

export const SUPERVISION_LABELS: Record<SupervisionCategory, string> = {
  unread_comments: "Commentaires non lus",
  awaiting_client_review: "En attente client",
  changes_requested: "Corrections demandées",
  scheduled: "Programmées",
  published: "Publiées",
  failed: "Échouées",
};

export type SupervisionFilters = {
  clientId?: string;
  projectId?: string;
  network?: SocialNetwork | "";
  from?: string;
  to?: string;
  responsibleId?: string;
};

export type SupervisionSummary = {
  counts: Record<SupervisionCategory, number>;
  actionRequired: number;
  generatedAt: string;
  filters: {
    projects: Array<{ id: string; name: string; clientId: string }>;
    clients: Array<{ id: string; name: string }>;
    responsibles: Array<{ id: string; name: string }>;
  };
};

export type SupervisionItem = {
  id: string;
  title: string;
  status: PublicationStatus;
  targetNetworks: SocialNetwork[];
  scheduledAt: string | null;
  updatedAt: string;
  activityAt: string;
  notificationId: string | null;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  responsibleId: string;
  responsibleName: string;
};

export type SupervisionItemsResponse = {
  data: SupervisionItem[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    durationMs: number;
  };
};
