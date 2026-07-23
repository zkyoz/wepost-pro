import { UnrecoverableError } from "bullmq";
import { describe, expect, it } from "vitest";
import {
  AiProviderDisabledError,
  MockAiTextProvider,
  parseAiOutput,
} from "../src/ai/provider.js";
import {
  aiBackoffDelay,
  processAiTextGeneration,
} from "../src/ai/processor.js";
import type {
  AiGenerationInput,
  AiGenerationRecord,
  AiGenerationRepository,
  AiTextProvider,
} from "../src/ai/types.js";

const input: AiGenerationInput = {
  brief: "Présenter le lancement de la nouvelle offre responsable.",
  tone: "professional",
  length: "short",
  language: "fr",
  variantCount: 3,
};

class MemoryRepository implements AiGenerationRepository {
  variants: Array<{ id: string; text: string }> = [];
  failures: Array<{ errorCode: string; final: boolean }> = [];

  constructor(
    public record: AiGenerationRecord | null = {
      id: "generation-1",
      status: "queued",
    },
  ) {}

  async find() {
    return this.record;
  }

  async markProcessing() {
    if (!this.record || this.record.status !== "queued") return false;
    this.record.status = "processing";
    return true;
  }

  async markCompleted(
    _id: string,
    variants: Array<{ id: string; text: string }>,
  ) {
    this.variants = variants;
    if (this.record) this.record.status = "completed";
  }

  async markFailed(
    _id: string,
    errorCode: string,
    _latencyMs: number,
    final: boolean,
  ) {
    this.failures.push({ errorCode, final });
    if (this.record) this.record.status = final ? "failed" : "queued";
  }
}

const job = (attemptsMade = 0) => ({
  data: { generationId: "generation-1", input },
  attemptsMade,
  opts: { attempts: 3 },
});

describe("AI text generation worker", () => {
  it("stores validated mock variants", async () => {
    const repository = new MemoryRepository();
    const result = await processAiTextGeneration(job(), {
      repository,
      provider: new MockAiTextProvider(),
    });
    expect(result.variantCount).toBe(3);
    expect(repository.record?.status).toBe("completed");
    expect(repository.variants).toHaveLength(3);
  });

  it("skips cancelled and completed work and rejects missing records", async () => {
    for (const status of ["cancelled", "completed"] as const) {
      const result = await processAiTextGeneration(job(), {
        repository: new MemoryRepository({ id: "generation-1", status }),
        provider: new MockAiTextProvider(),
      });
      expect(result.skipped).toBe(true);
    }
    await expect(
      processAiTextGeneration(job(), {
        repository: new MemoryRepository(null),
        provider: new MockAiTextProvider(),
      }),
    ).rejects.toBeInstanceOf(UnrecoverableError);
  });

  it("requeues a timeout then marks the last attempt failed", async () => {
    const provider: AiTextProvider = {
      async generate() {
        throw new Error("provider_timeout");
      },
    };
    for (const attempt of [0, 2]) {
      const repository = new MemoryRepository();
      await expect(
        processAiTextGeneration(job(attempt), { repository, provider }),
      ).rejects.toThrow("provider_timeout");
      expect(repository.failures[0]?.final).toBe(attempt === 2);
      expect(repository.record?.status).toBe(
        attempt === 2 ? "failed" : "queued",
      );
    }
  });

  it("does not retry invalid or disabled provider output", async () => {
    for (const provider of [
      {
        async generate() {
          return { output: { variants: [] } };
        },
      },
      {
        async generate(): Promise<never> {
          throw new AiProviderDisabledError();
        },
      },
    ]) {
      const repository = new MemoryRepository();
      await expect(
        processAiTextGeneration(job(), { repository, provider }),
      ).rejects.toBeInstanceOf(UnrecoverableError);
      expect(repository.failures[0]?.final).toBe(true);
    }
  });

  it("strictly parses count and length and applies the AI backoff", () => {
    expect(() => parseAiOutput({ variants: ["une seule"] }, input)).toThrow();
    expect(() =>
      parseAiOutput({ variants: ["x".repeat(281), "b", "c"] }, input),
    ).toThrow();
    expect(
      [1, 2, 3].map((attempt) => aiBackoffDelay(attempt, "wepost-ai")),
    ).toEqual([5_000, 30_000, 120_000]);
    expect(aiBackoffDelay(1, "other")).toBe(-1);
  });
});
