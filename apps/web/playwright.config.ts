import { defineConfig, devices } from "@playwright/test";

const e2eRunId =
  process.env.GITHUB_RUN_ID ??
  process.env.WEPOST_E2E_RUN_ID ??
  Date.now().toString();

const apiEnvironment = {
  NODE_ENV: "development",
  HOST: "127.0.0.1",
  PORT: "3333",
  APP_URL: "http://127.0.0.1:3333",
  DB_DATABASE: "wepost_test",
  SESSION_DRIVER: "redis",
  SESSION_COOKIE_NAME: "wepost_session_e2e",
  SESSION_COOKIE_DOMAIN: "",
  REDIS_SESSION_DB: "12",
  REDIS_LIMITER_DB: "13",
  REDIS_QUEUE_DB: "11",
  REDIS_KEY_PREFIX: `wepost:e2e:${e2eRunId}`,
  EMAIL_QUEUE_DRIVER: "memory",
  EMAIL_QUEUE_NAME: "wepost-jobs-e2e",
  COMMENT_EDIT_WINDOW_MINUTES: "15",
  SOCIAL_TOKEN_ENCRYPTION_KEY: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
  FACEBOOK_API_DRIVER: "mock",
  FACEBOOK_APP_ID: "facebook-e2e-app",
  FACEBOOK_APP_SECRET: "facebook-e2e-secret",
  FACEBOOK_GRAPH_API_VERSION: "v-test",
  FACEBOOK_OAUTH_REDIRECT_URI:
    "http://127.0.0.1:3333/api/v1/social/facebook/oauth/callback",
  FACEBOOK_OAUTH_SUCCESS_URL: "http://127.0.0.1:3000/settings/facebook",
  INSTAGRAM_API_DRIVER: "mock",
  INSTAGRAM_APP_ID: "instagram-e2e-app",
  INSTAGRAM_APP_SECRET: "instagram-e2e-secret",
  INSTAGRAM_GRAPH_API_VERSION: "v-test",
  INSTAGRAM_OAUTH_REDIRECT_URI:
    "http://127.0.0.1:3333/api/v1/social/instagram/oauth/callback",
  INSTAGRAM_OAUTH_SUCCESS_URL: "http://127.0.0.1:3000/settings/instagram",
  LINKEDIN_API_DRIVER: "mock",
  LINKEDIN_APP_ID: "linkedin-e2e-app",
  LINKEDIN_APP_SECRET: "linkedin-e2e-secret",
  LINKEDIN_API_VERSION: "202606",
  LINKEDIN_OAUTH_REDIRECT_URI:
    "http://127.0.0.1:3333/api/v1/social/linkedin/oauth/callback",
  LINKEDIN_OAUTH_SUCCESS_URL: "http://127.0.0.1:3000/settings/linkedin",
  PINTEREST_API_DRIVER: "mock",
  PINTEREST_APP_ID: "pinterest-e2e-app",
  PINTEREST_APP_SECRET: "pinterest-e2e-secret",
  PINTEREST_API_BASE_URL: "https://api-sandbox.pinterest.com/v5",
  PINTEREST_OAUTH_REDIRECT_URI:
    "http://127.0.0.1:3333/api/v1/social/pinterest/oauth/callback",
  PINTEREST_OAUTH_SUCCESS_URL: "http://127.0.0.1:3000/settings/pinterest",
  TIKTOK_API_DRIVER: "mock",
  TIKTOK_CLIENT_KEY: "tiktok-e2e-client",
  TIKTOK_CLIENT_SECRET: "tiktok-e2e-secret",
  TIKTOK_API_BASE_URL: "https://open.tiktokapis.com",
  TIKTOK_OAUTH_REDIRECT_URI:
    "http://127.0.0.1:3333/api/v1/social/tiktok/oauth/callback",
  TIKTOK_OAUTH_SUCCESS_URL: "http://127.0.0.1:3000/settings/tiktok",
  AI_PROVIDER_DRIVER: "mock",
  AI_DAILY_QUOTA: "50",
  LIMITER_STORE: "redis",
  AUTH_LOGIN_RATE_LIMIT: "100",
  CORS_ORIGINS: "http://127.0.0.1:3000",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "node ace serve",
      cwd: "../api",
      env: apiEnvironment,
      url: "http://127.0.0.1:3333/health/live",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        "node node_modules/nuxt/bin/nuxt.mjs dev --host 127.0.0.1 --port 3000",
      cwd: ".",
      env: {
        NUXT_PUBLIC_API_BASE: "http://127.0.0.1:3333/api/v1",
        NUXT_DEVTOOLS: "false",
      },
      url: "http://127.0.0.1:3000/auth/login",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
