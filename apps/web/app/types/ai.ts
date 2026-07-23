import type { Publication } from "~/types/publication";

export const AI_TONES = [
  { value: "professional", label: "Professionnel" },
  { value: "friendly", label: "Chaleureux" },
  { value: "engaging", label: "Engageant" },
  { value: "informative", label: "Informatif" },
] as const;
export const AI_LENGTHS = [
  { value: "short", label: "Courte — 280 caractères maximum" },
  { value: "medium", label: "Moyenne — 800 caractères maximum" },
  { value: "long", label: "Longue — 1 500 caractères maximum" },
] as const;
export const AI_LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "es", label: "Espagnol" },
] as const;

export type AiGenerationInput = {
  brief: string;
  tone: (typeof AI_TONES)[number]["value"];
  length: (typeof AI_LENGTHS)[number]["value"];
  language: (typeof AI_LANGUAGES)[number]["value"];
  variantCount: number;
};

export type AiGeneration = {
  id: string;
  publicationId: string;
  provider: string;
  model: string;
  promptVersion: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  variants: Array<{ id: string; text: string }>;
  warnings: string[];
  usage: { latencyMs?: number; providerUsage?: Record<string, number> | null };
  errorCode: string | null;
  appliedVariantId: string | null;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  appliedAt: string | null;
};

export type ApplyAiVariantResult = {
  generation: AiGeneration;
  publication: Publication;
};
