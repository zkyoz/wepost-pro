import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    include: ["tests/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "app/composables/**/*.ts",
        "app/middleware/**/*.ts",
        "app/utils/**/*.ts",
      ],
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
});
