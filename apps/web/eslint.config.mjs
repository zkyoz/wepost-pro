// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  ignores: [
    "coverage/**",
    "playwright-report/**",
    "playwright-report-public/**",
    "test-results/**",
  ],
  rules: {
    "vue/html-self-closing": "off",
  },
});
