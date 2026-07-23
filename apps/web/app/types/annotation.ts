import type { MediaAsset } from "./media";

export type AnnotationShape = "point" | "rectangle";

export type MediaAnnotation = {
  id: string;
  publicationId: string;
  mediaId: string;
  mediaVersion: string;
  commentId: string | null;
  publicationVersion: number;
  author: { id: string; displayName: string };
  shape: AnnotationShape;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  historical: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type AnnotationPayload = {
  shape: AnnotationShape;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  body: string;
  commentId?: string | null;
};

export type AnnotationListMeta = {
  currentPublicationVersion: number;
  mediaVersion: string;
  mediaCurrentlyAttached: boolean;
  openCount: number;
};

export type AnnotatableMedia = Pick<
  MediaAsset,
  "id" | "originalName" | "mimeType" | "readUrl" | "altText" | "isDecorative"
>;
