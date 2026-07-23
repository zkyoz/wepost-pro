// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-07-01",
  devtools: { enabled: process.env.NUXT_DEVTOOLS !== "false" },
  modules: ["@nuxt/eslint"],
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      htmlAttrs: { lang: "fr" },
      titleTemplate: "%s · Wepost.pro",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#061a38" },
      ],
    },
  },
  runtimeConfig: {
    public: {
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
      routes: [
        "/",
        "/mentions-legales",
        "/confidentialite",
        "/accessibilite",
        "/robots.txt",
        "/sitemap.xml",
      ],
    },
  },
  routeRules: {
    "/": {
      prerender: true,
      noScripts: !process.env.NUXT_PUBLIC_POSTHOG_KEY,
    },
    "/mentions-legales": { prerender: true, noScripts: true },
    "/confidentialite": { prerender: true, noScripts: true },
    "/accessibilite": { prerender: true, noScripts: true },
  },
});
