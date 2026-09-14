// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-07-01",
  devtools: { enabled: process.env.NUXT_DEVTOOLS !== "false" },
  modules: ["@nuxt/eslint", "@nuxt/ui"],
  css: [
    "~/assets/css/ui.css",
    "~/assets/css/main.css",
    "~/assets/css/design-system.css",
  ],
  ui: { fonts: false, colorMode: false },
  icon: {
    provider: "server",
    fallbackToApi: false,
    serverBundle: { collections: ["lucide", "simple-icons"] },
    clientBundle: {
      scan: true,
      icons: [
        "lucide:house",
        "lucide:folder",
        "lucide:calendar-days",
        "lucide:bell",
        "lucide:activity",
        "lucide:chart-no-axes-column-increasing",
        "lucide:users",
        "lucide:log-out",
        "lucide:plus",
        "lucide:arrow-right",
        "lucide:message-square",
        "lucide:circle-check",
        "lucide:triangle-alert",
        "lucide:menu",
        "lucide:x",
        "lucide:sun",
        "lucide:moon",
        "lucide:chevron-right",
        "lucide:image",
        "lucide:file-text",
        "lucide:send",
        "lucide:history",
        "lucide:sparkles",
        "lucide:languages",
        "lucide:layers",
        "lucide:pencil",
        "lucide:copy",
        "lucide:archive",
        "lucide:clock",
        "simple-icons:facebook",
        "simple-icons:instagram",
        "simple-icons:linkedin",
        "simple-icons:pinterest",
        "simple-icons:tiktok",
      ],
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: "fr" },
      titleTemplate: "%s · Wepost.pro",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#2f343a" },
      ],
    },
  },
  runtimeConfig: {
    public: {
      mediaOrigin: process.env.NUXT_PUBLIC_MEDIA_ORIGIN || "",
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE || "http://localhost:3333/api/v1",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
      posthogKey: process.env.NUXT_PUBLIC_POSTHOG_KEY || "",
      posthogHost:
        process.env.NUXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    },
  },
  nitro: {
    prerender: {
      routes: ["/robots.txt", "/sitemap.xml"],
    },
  },
  // HTML stays server-rendered per request so the saved theme is correct
  // before hydration; a shared prerendered page cannot read the preference.
});
