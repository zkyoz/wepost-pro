import type { PublicationStatus } from "./publication";

export type Comment = {
  id: string;
  publicationId: string;
  author: { id: string; displayName: string };
  body: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  canEdit: boolean;
  canDelete: boolean;
  annotationIds: string[];
};

export type ReviewDecision = "approved" | "changes_requested";

export type Review = {
  id: string;
  publicationId: string;
  reviewer: { id: string; displayName: string };
  version: number;
  decision: ReviewDecision;
  message: string | null;
  createdAt: string;
};

export type Discussion = { comments: Comment[]; reviews: Review[] };

export type ReviewResult = {
  review: Review;
  publication: {
    status: PublicationStatus;
    contentVersion: number;
    approvedVersion: number | null;
  };
};

export type Notification = {
  id: string;
  type:
    | "publication.comment_created"
    | "publication.review_approved"
    | "publication.review_changes_requested";
  payload: { publicationId: string; projectId: string };
  readAt: string | null;
  createdAt: string;
  emailStatus: "pending" | "sent" | "failed";
  emailAttempts: number;
};

export const NOTIFICATION_LABELS: Record<Notification["type"], string> = {
  "publication.comment_created": "Nouveau commentaire",
  "publication.review_approved": "Publication approuvée",
  "publication.review_changes_requested": "Corrections demandées",
};

export const REVIEW_LABELS: Record<ReviewDecision, string> = {
  approved: "Approuvée",
  changes_requested: "Corrections demandées",
};
