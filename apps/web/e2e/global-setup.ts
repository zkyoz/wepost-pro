import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export default function globalSetup() {
  const apiDirectory = fileURLToPath(new URL("../../api", import.meta.url));
  const result = spawnSync(
    process.execPath,
    ["ace.js", "migration:fresh", "--force"],
    {
      cwd: apiDirectory,
      env: {
        ...process.env,
        NODE_ENV: "development",
        DB_DATABASE: "wepost_test",
        SESSION_DRIVER: "redis",
        SESSION_COOKIE_NAME: "wepost_session_e2e",
        SESSION_COOKIE_DOMAIN: "",
        REDIS_SESSION_DB: "12",
        REDIS_LIMITER_DB: "13",
        REDIS_QUEUE_DB: "11",
        REDIS_KEY_PREFIX: "wepost:e2e",
        EMAIL_QUEUE_DRIVER: "memory",
        EMAIL_QUEUE_NAME: "wepost-jobs-e2e",
        COMMENT_EDIT_WINDOW_MINUTES: "15",
        LIMITER_STORE: "redis",
        AUTH_LOGIN_RATE_LIMIT: "100",
        CORS_ORIGINS: "http://127.0.0.1:3000",
      },
      stdio: "inherit",
    },
  );

  if (result.status !== 0)
    throw new Error("Unable to prepare the E2E database");

  const seedResult = spawnSync(
    process.execPath,
    ["ace.js", "test:seed-roles"],
    {
      cwd: apiDirectory,
      env: {
        ...process.env,
        NODE_ENV: "development",
        DB_DATABASE: "wepost_test",
        SESSION_DRIVER: "redis",
        SESSION_COOKIE_NAME: "wepost_session_e2e",
        SESSION_COOKIE_DOMAIN: "",
        REDIS_SESSION_DB: "12",
        REDIS_LIMITER_DB: "13",
        REDIS_QUEUE_DB: "11",
        REDIS_KEY_PREFIX: "wepost:e2e:seed",
        EMAIL_QUEUE_DRIVER: "memory",
        EMAIL_QUEUE_NAME: "wepost-jobs-e2e",
        COMMENT_EDIT_WINDOW_MINUTES: "15",
        LIMITER_STORE: "redis",
        AUTH_LOGIN_RATE_LIMIT: "100",
        CORS_ORIGINS: "http://127.0.0.1:3000",
      },
      stdio: "inherit",
    },
  );

  if (seedResult.status !== 0)
    throw new Error("Unable to seed E2E role accounts");
}
