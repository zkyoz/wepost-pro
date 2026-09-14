import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { r2LiveEnvironment, withoutR2Secrets } from "./demo-r2-env.mjs";
import { copyVerifiedMedia } from "./demo-r2-copy.mjs";

const base = {
  NODE_ENV: "development",
  DB_HOST: "127.0.0.1",
  DB_DATABASE: "wepost_demo",
  REDIS_HOST: "127.0.0.1",
  APP_KEY: "preserved",
  SOCIAL_TOKEN_ENCRYPTION_KEY: "preserved-social",
  MEDIA_STORAGE_DRIVER: "local",
  INSTAGRAM_DEMO_IMAGE_URL: "old-tunnel",
  MEDIA_LOCAL_DIRECTORY: "/private/demo",
};
const credentials = {
  R2_ACCOUNT_ID: "a".repeat(32),
  R2_BUCKET: "wepost-demo-media",
  R2_ENVIRONMENT_PREFIX: "bc03-demo",
  R2_ACCESS_KEY_ID: "test-only-id",
  R2_SECRET_ACCESS_KEY: "test-only-secret",
};

test("R2 setup preserves database and encryption and disables the temporary bridge", () => {
  const env = r2LiveEnvironment(base, credentials);
  assert.equal(env.MEDIA_STORAGE_DRIVER, "r2");
  assert.equal(env.MEDIA_SIGNED_URL_TTL_SECONDS, "300");
  assert.equal(env.APP_KEY, base.APP_KEY);
  assert.equal(
    env.SOCIAL_TOKEN_ENCRYPTION_KEY,
    base.SOCIAL_TOKEN_ENCRYPTION_KEY,
  );
  assert.equal(env.DB_DATABASE, "wepost_demo");
  assert.equal(env.INSTAGRAM_DEMO_IMAGE_URL, "");
  assert.equal(env.MEDIA_LOCAL_DIRECTORY, "");
  assert.equal(base.MEDIA_STORAGE_DRIVER, "local");
});
test("R2 setup rejects missing values, extra settings, other buckets and non-demo databases", () => {
  for (const invalid of [
    { ...credentials, R2_ACCESS_KEY_ID: "" },
    { ...credentials, APP_KEY: "overwrite" },
    { ...credentials, R2_ACCOUNT_ID: "bad/host" },
    { ...credentials, R2_BUCKET: "production" },
    { ...credentials, R2_ENVIRONMENT_PREFIX: "production" },
  ])
    assert.throws(() => r2LiveEnvironment(base, invalid));
  for (const invalid of [
    { ...base, NODE_ENV: "production" },
    { ...base, DB_DATABASE: "wepost" },
    { ...base, REDIS_HOST: "external" },
  ])
    assert.throws(() => r2LiveEnvironment(invalid, credentials));
});
test("R2 credentials are not passed to the Nuxt process", () => {
  const env = withoutR2Secrets({
    ...credentials,
    NUXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
  });
  assert.deepEqual(Object.keys(env), ["NUXT_PUBLIC_SITE_URL"]);
});

const bytes = Buffer.from("verified-demo-image");
const asset = {
  id: "demo-asset",
  storage_key: "development/image.jpg",
  size_bytes: bytes.length,
  checksum: createHash("sha256").update(bytes).digest("hex"),
  mime_type: "image/jpeg",
};
function fixture() {
  const remote = new Map();
  const writes = [];
  return {
    remote,
    writes,
    storage: {
      readLocal: async () => bytes,
      readRemote: async (key) => remote.get(key) ?? null,
      writeRemote: async (key, content) => {
        writes.push(key);
        remote.set(key, content);
      },
    },
  };
}
test("migration plan performs no write", async () => {
  const f = fixture();
  const result = await copyVerifiedMedia([asset], f.storage);
  assert.equal(result[0].status, "to-copy");
  assert.equal(f.writes.length, 0);
});
test("copy verifies exact bytes and can be rerun without overwriting", async () => {
  const f = fixture();
  assert.equal(
    (await copyVerifiedMedia([asset], f.storage, true))[0].status,
    "copied-verified",
  );
  assert.equal(
    (await copyVerifiedMedia([asset], f.storage, true))[0].status,
    "verified-existing",
  );
  assert.equal(f.writes.length, 1);
});
test("corrupt local data blocks all writes", async () => {
  const f = fixture();
  await assert.rejects(
    copyVerifiedMedia(
      [asset, { ...asset, id: "invalid", checksum: "wrong" }],
      f.storage,
      true,
    ),
    /LocalMediaIntegrity/,
  );
  assert.equal(f.writes.length, 0);
});
test("existing different remote data is never overwritten", async () => {
  const f = fixture();
  f.remote.set(asset.storage_key, Buffer.from("other-data"));
  await assert.rejects(
    copyVerifiedMedia([asset], f.storage, true),
    /RemoteMediaConflict/,
  );
  assert.equal(f.writes.length, 0);
});
test("failed readback is not reported as a successful migration", async () => {
  const f = fixture();
  f.storage.writeRemote = async () => {};
  await assert.rejects(
    copyVerifiedMedia([asset], f.storage, true),
    /RemoteMediaVerificationFailed/,
  );
});
