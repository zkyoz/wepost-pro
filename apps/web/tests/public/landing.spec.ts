import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it } from "vitest";
import LandingPage from "~/pages/index.vue";
import AnalyticsConsent from "~/components/AnalyticsConsent.vue";
import { buildCanonicalUrl, landingSeoMeta } from "~/utils/public-seo";

describe("public landing page", () => {
  beforeEach(() => {
    clearNuxtState();
    const storage = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => storage.clear(),
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => storage.delete(key),
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
  });

  it("renders the product promise, workflow, networks and legal navigation", async () => {
    const wrapper = await mountSuspended(LandingPage);

    expect(wrapper.get("h1").text()).toContain(
      "Planifiez, validez et publiez au même endroit.",
    );
    expect(wrapper.findAll("#workflow li")).toHaveLength(4);
    expect(
      wrapper.findAll(".network-strip li").map((item) => item.text()),
    ).toEqual(["Facebook", "Instagram", "LinkedIn", "Pinterest", "TikTok"]);
    expect(wrapper.findAll("details")).toHaveLength(4);
    expect(wrapper.find('a[href="/auth/login"]').exists()).toBe(true);
    expect(wrapper.text()).not.toMatch(/\b\d+[,.]?\d*\s*%/);
  });

  it("defines stable metadata and a canonical URL", () => {
    expect(landingSeoMeta.title).toContain("Publications sociales");
    expect(landingSeoMeta.description).toContain("calendrier éditorial");
    expect(buildCanonicalUrl("https://wepost.pro/path")).toBe(
      "https://wepost.pro/",
    );
  });

  it("keeps analytics absent when it is not configured", async () => {
    const wrapper = await mountSuspended(AnalyticsConsent);
    expect(wrapper.find(".consent-banner").exists()).toBe(false);
    expect(window.localStorage.getItem("wepost_analytics_consent")).toBeNull();
  });
});
