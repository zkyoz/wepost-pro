// Operator-only, local demo. Never accepts a token on the command line or logs it.
import { readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { parseEnv } from "node:util";
import { encryptSocialToken } from "../../apps/api/build/app/services/social/token_cipher.js";

const directory = new URL("../../.demo/", import.meta.url);
const env = parseEnv(await readFile(new URL("runtime.env", directory), "utf8"));
if (
  env.NODE_ENV !== "development" ||
  env.DB_HOST !== "127.0.0.1" ||
  env.DB_DATABASE !== "wepost_demo"
)
  throw new Error("DemoLocalDatabaseRequired");
const tokenFile = new URL("instagram.env", directory);
if ((await stat(tokenFile)).mode & 0o077)
  throw new Error("InstagramTokenFileMustBePrivate");
const credentials = parseEnv(await readFile(tokenFile, "utf8"));
const token = credentials.INSTAGRAM_ACCESS_TOKEN;
const expectedUsername = credentials.INSTAGRAM_USERNAME?.replace(/^@/, "");
if (!token || !expectedUsername)
  throw new Error("InstagramLocalCredentialsRequired");
async function graph(path) {
  const response = await fetch(`https://graph.instagram.com/v26.0/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok || result.error)
    throw new Error(
      `InstagramVerificationFailed_HTTP_${response.status}_code_${result.error?.code ?? "unknown"}`,
    );
  return result;
}
const identity = await graph("me?fields=user_id,username");
if (identity.username !== expectedUsername || !/^\d+$/.test(identity.user_id))
  throw new Error("InstagramAccountDoesNotMatchRequestedTestAccount");
await graph(`${identity.user_id}/content_publishing_limit?fields=quota_usage`);
const require = createRequire(
  new URL("../../apps/worker/package.json", import.meta.url),
);
const { Pool } = require("pg");
const pool = new Pool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  database: env.DB_DATABASE,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const actor = (
    await client.query(
      "SELECT id, agency_id FROM users WHERE email = $1 AND role = 'agency' AND is_active = true",
      ["agence@wepost.local"],
    )
  ).rows[0];
  if (!actor?.agency_id) throw new Error("DemoAgencyNotFound");
  const metadata = JSON.stringify({
    driver: "instagram",
    loginMode: "instagram",
    connectionMethod: "local-authorized-token",
    verifiedEndpoints: ["me", "content_publishing_limit"],
  });
  const connected = (
    await client.query(
      `INSERT INTO social_accounts
    (id, agency_id, network, external_account_id, external_account_name, encrypted_access_token,
     encrypted_refresh_token, expires_at, scopes, metadata_json, status, created_by, created_at, updated_at)
    VALUES ($1,$2,'instagram',$3,$4,$5,NULL,NULL,'[]'::jsonb,$6::jsonb,'connected',$7,NOW(),NOW())
    ON CONFLICT (agency_id, network, external_account_id) DO UPDATE SET
      external_account_name=EXCLUDED.external_account_name, encrypted_access_token=EXCLUDED.encrypted_access_token,
      encrypted_refresh_token=NULL, expires_at=NULL, scopes='[]'::jsonb, metadata_json=EXCLUDED.metadata_json,
      status='connected', revoked_at=NULL, updated_at=NOW() RETURNING id`,
      [
        randomUUID(),
        actor.agency_id,
        identity.user_id,
        `@${identity.username}`,
        encryptSocialToken(token, env.SOCIAL_TOKEN_ENCRYPTION_KEY),
        metadata,
        actor.id,
      ],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO audit_logs (id, actor_user_id, action, previous_values, next_values, created_at)
    VALUES ($1,$2,'social.instagram_connected','{}'::jsonb,$3::jsonb,NOW())`,
    [
      randomUUID(),
      actor.id,
      JSON.stringify({
        accountId: connected.id,
        method: "local-authorized-token",
        username: identity.username,
      }),
    ],
  );
  await client.query("COMMIT");
  console.log(
    JSON.stringify({
      accountId: connected.id,
      username: identity.username,
      identityVerified: true,
      publishingQuotaAccessible: true,
      tokenStorage: "AES-256-GCM",
      scopes: "not enumerated",
      expiresAt: "not provided",
    }),
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
