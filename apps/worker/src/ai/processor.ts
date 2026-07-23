import { UnrecoverableError, type Job } from "bullmq";
import {
  AiProviderDisabledError,
  InvalidAiProviderOutputError,
  parseAiOutput,
} from "./provider.js";
import type {
  AiGenerationRepository,
  AiTextGenerationJob,
  AiTextProvider,
} from "./types.js";

export type AiProcessorDependencies = {
  repository: AiGenerationRepository;
  provider: AiTextProvider;
};

export function aiBackoffDelay(attemptsMade: number, type?: string) {
  if (type !== "wepost-ai") return -1;
  return [5_000, 30_000, 120_000][attemptsMade - 1] ?? -1;
}

export async function processAiTextGeneration(
  job: Pick<Job<AiTextGenerationJob>, "data" | "attemptsMade" | "opts">,
  dependencies: AiProcessorDependencies,
) {
  const startedAt = performance.now();
  const generation = await dependencies.repository.find(job.data.generationId);
  if (!generation) throw new UnrecoverableError("generation_not_found");
  if (generation.status === "cancelled" || generation.status === "completed") {
    return { skipped: true };
  }
  if (generation.status !== "queued") {
    throw new UnrecoverableError("generation_invalid_state");
  }
  if (!(await dependencies.repository.markProcessing(generation.id))) {
    return { skipped: true };
  }
  try {
    const result = await dependencies.provider.generate(job.data.input);
    const variants = parseAiOutput(result.output, job.data.input);
    const latencyMs = Math.round((performance.now() - startedAt) * 100) / 100;
    await dependencies.repository.markCompleted(generation.id, variants, {
      latencyMs,
      providerUsage: result.usage ?? null,
    });
    return {
      skipped: false,
      durationMs: latencyMs,
      variantCount: variants.length,
    };
  } catch (error) {
    const latencyMs = Math.round((performance.now() - startedAt) * 100) / 100;
    const permanent =
      error instanceof InvalidAiProviderOutputError ||
      error instanceof AiProviderDisabledError;
    const lastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
    await dependencies.repository.markFailed(
      generation.id,
      permanent || lastAttempt
        ? error instanceof Error
          ? error.name
          : "UnknownError"
        : "RetryableProviderError",
      latencyMs,
      permanent || lastAttempt,
    );
    if (permanent) throw new UnrecoverableError((error as Error).name);
    throw error instanceof Error ? error : new Error("UnknownError");
  }
}
