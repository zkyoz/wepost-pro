import type { SocialNetwork } from "~/types/publication";

export type NetworkVariantStatus = "draft" | "approved" | "stale";

export type NetworkVariant = {
  id: string;
  publicationId: string;
  network: SocialNetwork;
  sourceVersion: number;
  text: string;
  status: NetworkVariantStatus;
  generatedByAi: boolean;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  staleAt: string | null;
  createdAt: string;
  updatedAt: string;
  textLimit: number | null;
};

export type NetworkVariantList = {
  data: NetworkVariant[];
  meta: {
    sourceVersion: number;
    sourceText: string;
    limits: Partial<Record<SocialNetwork, number | null>>;
  };
};

export type NetworkVariantGenerationInput = {
  networks: SocialNetwork[];
  tone: "professional" | "friendly" | "engaging" | "informative";
  length: "short" | "medium" | "long";
  language: "fr" | "en" | "es";
};
