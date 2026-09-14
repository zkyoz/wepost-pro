import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PostgresSocialPublicationRepository } from "../src/social/repository.js";

// Real SQL, isolated connection-local tables; never target the demonstration database.
const database = process.env.DB_DATABASE ?? "wepost_test";
if (!database.endsWith("_test"))
  throw new Error("A dedicated _test database is required");
const pool = new Pool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? "wepost",
  password: process.env.DB_PASSWORD ?? "wepost",
  database,
  max: 1,
});
const repository = new PostgresSocialPublicationRepository(pool, "instagram");

beforeAll(async () => {
  await pool.query(`
    CREATE TEMP TABLE publications (
      id uuid PRIMARY KEY, target_networks text[] NOT NULL,
      content_version integer NOT NULL, approved_version integer,
      status text NOT NULL, updated_at timestamptz DEFAULT NOW()
    );
    CREATE TEMP TABLE scheduled_publications (
      id uuid PRIMARY KEY, publication_id uuid NOT NULL, network text NOT NULL,
      publication_version integer NOT NULL, status text NOT NULL,
      updated_at timestamptz DEFAULT NOW()
    );
    CREATE TEMP TABLE publication_attempts (
      scheduled_id uuid, attempt integer, result text, remote_post_id text,
      finished_at timestamptz, normalized_error jsonb
    );
  `);
});
beforeEach(async () => {
  await pool.query(
    "TRUNCATE pg_temp.publication_attempts, pg_temp.scheduled_publications, pg_temp.publications",
  );
});
afterAll(() => pool.end());

async function fixture(targets = ["instagram", "linkedin"]) {
  const publicationId = randomUUID();
  const scheduleId = randomUUID();
  await pool.query(
    "INSERT INTO publications (id,target_networks,content_version,approved_version,status) VALUES ($1,$2,2,2,'publishing')",
    [publicationId, targets],
  );
  await pool.query(
    "INSERT INTO scheduled_publications (id,publication_id,network,publication_version,status) VALUES ($1,$2,'instagram',2,'publishing')",
    [scheduleId, publicationId],
  );
  await pool.query(
    "INSERT INTO publication_attempts (scheduled_id,attempt,result) VALUES ($1,1,'started')",
    [scheduleId],
  );
  return { publicationId, scheduleId };
}
async function status(publicationId: string) {
  return (
    await pool.query("SELECT status FROM publications WHERE id=$1", [
      publicationId,
    ])
  ).rows[0].status;
}
const result = {
  remotePostId: "instagram-test-only",
  rawCode: "201",
  publishedAt: new Date().toISOString(),
};

describe("social publication aggregate in PostgreSQL", () => {
  it("keeps a targeted but not yet scheduled network pending", async () => {
    const { publicationId, scheduleId } = await fixture();
    await repository.markPublished(scheduleId, 1, result);
    expect(await status(publicationId)).toBe("scheduled");
    expect(
      (
        await pool.query(
          "SELECT status FROM scheduled_publications WHERE id=$1",
          [scheduleId],
        )
      ).rows[0].status,
    ).toBe("published");
  });

  it("does not count an older version as delivery of the current target", async () => {
    const { publicationId, scheduleId } = await fixture();
    await pool.query(
      "INSERT INTO scheduled_publications (id,publication_id,network,publication_version,status) VALUES ($1,$2,'linkedin',1,'published')",
      [randomUUID(), publicationId],
    );
    await repository.markPublished(scheduleId, 1, result);
    expect(await status(publicationId)).toBe("scheduled");
  });

  it("becomes published once every targeted network has finished", async () => {
    const { publicationId, scheduleId } = await fixture();
    const linkedinId = randomUUID();
    await pool.query(
      "INSERT INTO scheduled_publications (id,publication_id,network,publication_version,status) VALUES ($1,$2,'linkedin',2,'queued')",
      [linkedinId, publicationId],
    );
    await repository.markPublished(scheduleId, 1, result);
    expect(await status(publicationId)).toBe("scheduled");
    await repository.ensurePublished(linkedinId, "linkedin-test-only");
    expect(await status(publicationId)).toBe("published");
  });

  it("keeps a missing target pending when replaying an already delivered job", async () => {
    const { publicationId, scheduleId } = await fixture();
    await repository.ensurePublished(scheduleId, result.remotePostId);
    expect(await status(publicationId)).toBe("scheduled");
  });

  it("still completes a single-network publication", async () => {
    const { publicationId, scheduleId } = await fixture(["instagram"]);
    await repository.markPublished(scheduleId, 1, result);
    expect(await status(publicationId)).toBe("published");
  });

  it("does not overwrite a newer review with the result of an older job", async () => {
    const { publicationId, scheduleId } = await fixture();
    await pool.query(
      "UPDATE publications SET content_version=3, approved_version=NULL,status='awaiting_client_review' WHERE id=$1",
      [publicationId],
    );
    await repository.markPublished(scheduleId, 1, result);
    expect(await status(publicationId)).toBe("awaiting_client_review");
  });
});
