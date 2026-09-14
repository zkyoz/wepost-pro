import assert from "node:assert/strict";
import { test } from "node:test";
import { linkedinLiveEnvironment } from "./demo-linkedin-env.mjs";

const base = {
  NODE_ENV: "development",
  DB_HOST: "127.0.0.1",
  REDIS_HOST: "127.0.0.1",
  APP_KEY: "kept",
  FACEBOOK_API_DRIVER: "mock",
};
const credentials = {
  LINKEDIN_APP_ID: "test-app",
  LINKEDIN_APP_SECRET: "test-only",
  LINKEDIN_API_VERSION: "202606",
};

test("enables only LinkedIn and preserves local database and encryption settings", () => {
  const result = linkedinLiveEnvironment(base, credentials);
  assert.equal(result.LINKEDIN_API_DRIVER, "linkedin");
  assert.equal(result.FACEBOOK_API_DRIVER, "mock");
  assert.equal(result.APP_KEY, "kept");
  assert.equal(
    result.LINKEDIN_OAUTH_REDIRECT_URI,
    "http://127.0.0.1:3333/api/v1/social/linkedin/oauth/callback",
  );
});
test("rejects missing credentials, invalid versions and unrelated overrides", () => {
  assert.throws(
    () => linkedinLiveEnvironment(base, {}),
    /Configuration réelle manquante/,
  );
  assert.throws(
    () =>
      linkedinLiveEnvironment(base, { ...credentials, DB_DATABASE: "other" }),
    /trois paramètres/,
  );
  assert.throws(
    () =>
      linkedinLiveEnvironment(base, {
        ...credentials,
        LINKEDIN_API_VERSION: "202613",
      }),
    /AAAAMM/,
  );
  assert.throws(
    () =>
      linkedinLiveEnvironment({ ...base, NODE_ENV: "production" }, credentials),
    /local/,
  );
});
