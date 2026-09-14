import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ErrorPage from "~/error.vue";

describe("application error page", () => {
  it.each([
    [404, "Page introuvable"],
    [500, "Une erreur est survenue"],
  ])(
    "renders a safe, branded message for HTTP %s",
    async (statusCode, title) => {
      const wrapper = await mountSuspended(ErrorPage, {
        props: {
          error: {
            statusCode: Number(statusCode),
            statusMessage: "Private database details",
            message: "Private database details",
            name: "NuxtError",
          },
        },
      });
      expect(wrapper.get("h1").text()).toBe(title);
      expect(wrapper.text()).not.toContain("Private database details");
      expect(wrapper.get(".button-primary").text()).toBe("Revenir à l’accueil");
      expect(wrapper.get("main").attributes("id")).toBe("main-content");
      wrapper.unmount();
    },
  );
});
