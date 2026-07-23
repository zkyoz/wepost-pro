import type { Pool } from "pg";
import type {
  PublishResult,
  ScheduledFacebookPublication,
  ScheduledTikTokPublication,
  SocialPublicationRepository,
  SocialPublishError,
} from "./types.js";

type ScheduleRow = {
  id: string;
  publication_id: string;
  publication_version: number;
  current_version: number;
  approved_version: number | null;
  publication_status: string;
  idempotency_key: string;
  payload_hash: string;
  account_id: string;
  account_status: string;
  expires_at: Date | null;
  external_account_id: string;
  encrypted_access_token: string | null;
  base_text: string;
  remote_post_id: string | null;
  network_payload_json: Record<string, unknown>;
  provider_job_id: string | null;
  provider_status: string | null;
};

export class PostgresSocialPublicationRepository implements SocialPublicationRepository {
  constructor(
    private readonly pool: Pool,
    private readonly network:
      | "facebook"
      | "instagram"
      | "linkedin"
      | "pinterest"
      | "tiktok" = "facebook",
  ) {}

  async findForPublish(
    id: string,
  ): Promise<ScheduledFacebookPublication | ScheduledTikTokPublication | null> {
    const result = await this.pool.query<ScheduleRow>(
      `SELECT sp.id, sp.publication_id, sp.publication_version,
              p.content_version AS current_version, p.approved_version,
              p.status AS publication_status, p.base_text, sp.idempotency_key, sp.payload_hash,
              sp.network_payload_json, sp.provider_job_id, sp.provider_status,
              sa.id AS account_id, sa.status AS account_status, sa.expires_at,
              sa.external_account_id, sa.encrypted_access_token,
              published.remote_post_id
       FROM scheduled_publications sp
       INNER JOIN publications p ON p.id = sp.publication_id
       INNER JOIN social_accounts sa ON sa.id = sp.account_id
       LEFT JOIN LATERAL (
         SELECT pa.remote_post_id
         FROM publication_attempts pa
         WHERE pa.scheduled_id = sp.id AND pa.remote_post_id IS NOT NULL
         ORDER BY pa.attempt DESC LIMIT 1
       ) published ON TRUE
       WHERE sp.id = $1 AND sp.network = $2`,
      [id, this.network],
    );
    const row = result.rows[0];
    if (!row) return null;
    const media = await this.pool.query<{
      storage_key: string;
      mime_type: string;
      checksum: string;
      position: number;
      size_bytes: number;
      width: number | null;
      height: number | null;
      duration_ms: number | null;
    }>(
      `SELECT ma.storage_key, ma.mime_type, ma.checksum, ma.size_bytes,
              ma.width, ma.height, ma.duration_ms, pm.position
       FROM publication_media pm
       INNER JOIN media_assets ma ON ma.id = pm.media_id
       WHERE pm.publication_id = $1 AND ma.deleted_at IS NULL AND ma.scan_status = 'clean'
       ORDER BY pm.position`,
      [row.publication_id],
    );
    return {
      id: row.id,
      publicationId: row.publication_id,
      publicationVersion: row.publication_version,
      currentVersion: row.current_version,
      approvedVersion: row.approved_version,
      publicationStatus: row.publication_status,
      idempotencyKey: row.idempotency_key,
      payloadHash: row.payload_hash,
      accountId: row.account_id,
      accountStatus: row.account_status,
      accountExpiresAt: row.expires_at,
      externalAccountId: row.external_account_id,
      encryptedAccessToken: row.encrypted_access_token,
      text:
        typeof row.network_payload_json?.text === "string"
          ? row.network_payload_json.text
          : row.base_text,
      media: media.rows.map((item) => ({
        storageKey: item.storage_key,
        mimeType: item.mime_type,
        checksum: item.checksum,
        position: item.position,
        sizeBytes: Number(item.size_bytes),
        width: item.width,
        height: item.height,
        durationMs: item.duration_ms,
      })),
      remotePostId: row.remote_post_id,
      networkPayload: row.network_payload_json ?? {},
      ...(this.network === "tiktok"
        ? {
            providerJobId: row.provider_job_id,
            providerStatus: row.provider_status,
          }
        : {}),
    };
  }

  async beginAttempt(id: string) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [id]);
      const existing = await client.query<{ remote_post_id: string }>(
        `SELECT remote_post_id FROM publication_attempts
         WHERE scheduled_id = $1 AND remote_post_id IS NOT NULL
         ORDER BY attempt DESC LIMIT 1`,
        [id],
      );
      if (existing.rows[0]) {
        await client.query("COMMIT");
        return { attempt: 0, remotePostId: existing.rows[0].remote_post_id };
      }
      const count = await client.query<{ next_attempt: number }>(
        `SELECT COALESCE(MAX(attempt), 0) + 1 AS next_attempt
         FROM publication_attempts WHERE scheduled_id = $1`,
        [id],
      );
      const attempt = Number(count.rows[0]?.next_attempt ?? 1);
      await client.query(
        `INSERT INTO publication_attempts (id, scheduled_id, attempt, started_at, result)
         VALUES (gen_random_uuid(), $1, $2, NOW(), 'started')`,
        [id, attempt],
      );
      await client.query(
        `UPDATE scheduled_publications SET status = 'publishing', updated_at = NOW() WHERE id = $1`,
        [id],
      );
      await client.query(
        `UPDATE publications SET status = 'publishing', updated_at = NOW()
         WHERE id = (SELECT publication_id FROM scheduled_publications WHERE id = $1)`,
        [id],
      );
      await client.query("COMMIT");
      return { attempt, remotePostId: null };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async ensurePublished(id: string, remotePostId: string) {
    await this.pool.query(
      `WITH updated AS (
         UPDATE scheduled_publications SET status = 'published', updated_at = NOW()
         WHERE id = $1 RETURNING publication_id
       )
       UPDATE publications p
       SET status = CASE
         WHEN EXISTS (
           SELECT 1 FROM scheduled_publications pending
           WHERE pending.publication_id = p.id
             AND pending.status NOT IN ('published', 'cancelled')
         ) THEN 'scheduled'
         ELSE 'published'
       END, updated_at = NOW()
       WHERE p.id = (SELECT publication_id FROM updated)`,
      [id],
    );
  }

  async markPublished(id: string, attempt: number, result: PublishResult) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE publication_attempts
         SET finished_at = NOW(), result = 'success', normalized_error = NULL, remote_post_id = $3
         WHERE scheduled_id = $1 AND attempt = $2`,
        [id, attempt, result.remotePostId],
      );
      const schedule = await client.query<{ publication_id: string }>(
        `UPDATE scheduled_publications SET status = 'published', updated_at = NOW()
         WHERE id = $1 RETURNING publication_id`,
        [id],
      );
      await client.query(
        `UPDATE publications p
         SET status = CASE
           WHEN EXISTS (
             SELECT 1 FROM scheduled_publications pending
             WHERE pending.publication_id = p.id
               AND pending.status NOT IN ('published', 'cancelled')
           ) THEN 'scheduled'
           ELSE 'published'
         END, updated_at = NOW()
         WHERE p.id = $1`,
        [schedule.rows[0]?.publication_id],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async markAttemptFailed(
    id: string,
    attempt: number,
    error: SocialPublishError,
    final: boolean,
  ) {
    const result = error.retryable ? "transient_failure" : "permanent_failure";
    const scheduleStatus = final ? "failed" : "queued";
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE publication_attempts
         SET finished_at = NOW(), result = $3, normalized_error = $4
         WHERE scheduled_id = $1 AND attempt = $2`,
        [id, attempt, result, JSON.stringify(error)],
      );
      const schedule = await client.query<{ publication_id: string }>(
        `UPDATE scheduled_publications SET status = $2, updated_at = NOW()
         WHERE id = $1 RETURNING publication_id`,
        [id, scheduleStatus],
      );
      await client.query(
        `UPDATE publications p
         SET status = CASE
           WHEN EXISTS (
             SELECT 1 FROM scheduled_publications active
             WHERE active.publication_id = p.id
               AND active.status IN ('queued', 'publishing')
           ) THEN 'scheduled'
           WHEN EXISTS (
             SELECT 1 FROM scheduled_publications failed
             WHERE failed.publication_id = p.id AND failed.status = 'failed'
           ) THEN 'failed'
           ELSE 'published'
         END, updated_at = NOW()
         WHERE p.id = $1`,
        [schedule.rows[0]?.publication_id],
      );
      await client.query("COMMIT");
    } catch (cause) {
      await client.query("ROLLBACK");
      throw cause;
    } finally {
      client.release();
    }
  }

  async markAccountExpired(accountId: string) {
    await this.pool.query(
      `UPDATE social_accounts SET status = 'expired', updated_at = NOW() WHERE id = $1`,
      [accountId],
    );
  }

  async markProviderJob(
    id: string,
    providerJobId: string,
    providerStatus: string,
  ) {
    await this.pool.query(
      `UPDATE scheduled_publications
       SET provider_job_id = $2, provider_status = $3, updated_at = NOW()
       WHERE id = $1 AND network = 'tiktok'`,
      [id, providerJobId, providerStatus],
    );
  }
}
