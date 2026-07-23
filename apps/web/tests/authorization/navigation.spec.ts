import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import AppNavigation from "~/components/AppNavigation.vue";

describe("AppNavigation", () => {
  it.each([
    { role: "admin" as const, seesAdmin: true },
    { role: "agency" as const, seesAdmin: false },
    { role: "client" as const, seesAdmin: false },
  ])("adapts links for $role", async ({ role, seesAdmin }) => {
    const wrapper = await mountSuspended(AppNavigation, { props: { role } });
    expect(wrapper.text()).toContain("Vue d’ensemble");
    expect(wrapper.text()).toContain("Projets");
    expect(wrapper.text()).toContain("Calendrier");
    expect(wrapper.text()).toContain("Notifications");
    expect(wrapper.text().includes("Supervision")).toBe(role !== "client");
    expect(wrapper.text().includes("Statistiques")).toBe(role !== "client");
    expect(wrapper.text().includes("Facebook")).toBe(role !== "client");
    expect(wrapper.text().includes("LinkedIn")).toBe(role !== "client");
    expect(wrapper.text().includes("Pinterest")).toBe(role !== "client");
    expect(wrapper.text().includes("Administration")).toBe(seesAdmin);
    expect(wrapper.text()).toContain(
      role === "admin"
        ? "Administrateur"
        : role === "agency"
          ? "Agence"
          : "Client",
    );
  });
});
