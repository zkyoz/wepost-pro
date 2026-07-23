import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "landing.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report-public" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command:
      "node node_modules/nuxt/bin/nuxt.mjs dev --host 127.0.0.1 --port 3000",
    cwd: ".",
    env: {
      NUXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NUXT_DEVTOOLS: "false",
    },
    url: "http://127.0.0.1:3000/",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
