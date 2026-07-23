import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/processor.ts",
        "src/template.ts",
        "src/social/processor.ts",
        "src/social/facebook_adapter.ts",
        "src/social/instagram_processor.ts",
        "src/social/instagram_adapter.ts",
        "src/social/linkedin_processor.ts",
        "src/social/linkedin_adapter.ts",
        "src/social/pinterest_processor.ts",
        "src/social/pinterest_adapter.ts",
        "src/social/tiktok_processor.ts",
        "src/social/tiktok_adapter.ts",
        "src/ai/processor.ts",
        "src/ai/provider.ts",
      ],
      thresholds: { lines: 80, branches: 70 },
    },
  },
});
