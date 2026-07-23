import type { AppLocale } from "~/types/auth";

export type TranslationStatus = "draft" | "approved" | "stale";

export type PublicationTranslation = {
  id: string;
  publicationId: string;
  sourceLocale: AppLocale;
  targetLocale: AppLocale;
  sourceVersion: number;
  text: string;
  status: TranslationStatus;
  generatedByAi: boolean;
  provider: string | null;
  model: string | null;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TranslationList = {
  data: PublicationTranslation[];
  meta: { sourceText: string; sourceVersion: number };
};
