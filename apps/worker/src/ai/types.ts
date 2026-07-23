export type AiGenerationInput = {
  brief: string;
  tone: "professional" | "friendly" | "engaging" | "informative";
  length: "short" | "medium" | "long";
  language: "fr" | "en" | "es";
  variantCount: number;
};

export type AiTextGenerationJob = {
  generationId: string;
  input: AiGenerationInput;
};

export type AiGenerationRecord = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
};

export interface AiGenerationRepository {
  find(id: string): Promise<AiGenerationRecord | null>;
  markProcessing(id: string): Promise<boolean>;
  markCompleted(
    id: string,
    variants: Array<{ id: string; text: string }>,
    usage: { latencyMs: number; providerUsage: Record<string, number> | null },
  ): Promise<void>;
  markFailed(
    id: string,
    errorCode: string,
    latencyMs: number,
    final: boolean,
  ): Promise<void>;
}

export type AiProviderResult = {
  output: unknown;
  usage?: Record<string, number>;
};

export interface AiTextProvider {
  generate(input: AiGenerationInput): Promise<AiProviderResult>;
}
