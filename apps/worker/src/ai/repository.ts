import type { Pool } from "pg";
import type { AiGenerationRecord, AiGenerationRepository } from "./types.js";

export class PostgresAiGenerationRepository implements AiGenerationRepository {
  constructor(private readonly pool: Pool) {}

  async find(id: string) {
    const result = await this.pool.query<AiGenerationRecord>(
      "SELECT id, status FROM ai_generations WHERE id = $1",
      [id],
    );
    return result.rows[0] ?? null;
  }

  async markProcessing(id: string) {
    const result = await this.pool.query(
      `UPDATE ai_generations SET status = 'processing'
       WHERE id = $1 AND status = 'queued'`,
      [id],
    );
    return (result.rowCount ?? 0) === 1;
  }

  async markCompleted(
    id: string,
    variants: Array<{ id: string; text: string }>,
    usage: { latencyMs: number; providerUsage: Record<string, number> | null },
  ) {
    await this.pool.query(
      `UPDATE ai_generations
       SET status = 'completed', output_json = $2, usage_json = $3,
           error_code = NULL, completed_at = NOW()
       WHERE id = $1 AND status = 'processing'`,
      [id, JSON.stringify({ variants, warnings: [] }), JSON.stringify(usage)],
    );
  }

  async markFailed(
    id: string,
    errorCode: string,
    latencyMs: number,
    final: boolean,
  ) {
    await this.pool.query(
      `UPDATE ai_generations
       SET status = $4, error_code = $2, usage_json = $3
       WHERE id = $1 AND status = 'processing'`,
      [
        id,
        errorCode.slice(0, 80),
        JSON.stringify({ latencyMs, providerUsage: null }),
        final ? "failed" : "queued",
      ],
    );
  }
}
