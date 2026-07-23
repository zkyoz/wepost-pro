import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CalendarExportPanel from "~/components/CalendarExportPanel.vue";

const { calendarApi } = vi.hoisted(() => ({
  calendarApi: {
    download: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    revoke: vi.fn(),
  },
}));

mockNuxtImport("useCalendarFeedApi", () => () => calendarApi);

describe("CalendarExportPanel", () => {
  beforeEach(() => {
    for (const method of Object.values(calendarApi)) method.mockReset();
    calendarApi.list.mockResolvedValue({ data: [] });
    calendarApi.create.mockResolvedValue({
      data: {
        id: "feed-id",
        projectId: "project-id",
        projectName: "Projet test",
        createdAt: "2026-07-23T00:00:00.000Z",
        lastUsedAt: null,
        revokedAt: null,
      },
      feedPath: `/api/v1/calendar/feeds/${"a".repeat(64)}`,
    });
    calendarApi.revoke.mockResolvedValue(undefined);
    Object.defineProperty(window, "confirm", {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("creates, announces, copies and revokes a one-time subscription URL", async () => {
    const wrapper = await mountSuspended(CalendarExportPanel, {
      props: {
        projects: [{ id: "project-id", name: "Projet test" }],
        rangeStart: "2026-07-01T00:00",
        rangeEnd: "2026-08-01T00:00",
        timezone: "Europe/Paris",
        selectedProjectId: "project-id",
      },
    });
    await flushPromises();
    await wrapper.get('button[type="button"]').trigger("click");
    await flushPromises();

    expect(calendarApi.create).toHaveBeenCalledWith("project-id");
    expect(wrapper.text()).toContain("affiché une seule fois");
    expect(wrapper.text()).toContain("Projet test");
    await wrapper
      .findAll('button[type="button"]')
      .find((button) => button.text().includes("Copier"))!
      .trigger("click");
    await flushPromises();
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    await wrapper
      .findAll('button[type="button"]')
      .find((button) => button.text().includes("Révoquer"))!
      .trigger("click");
    await flushPromises();
    expect(calendarApi.revoke).toHaveBeenCalledWith("feed-id");
    expect(wrapper.text()).toContain("Révoqué");
  });

  it("provides structured instructions and explicit control names", async () => {
    const wrapper = await mountSuspended(CalendarExportPanel, {
      props: {
        projects: [],
        rangeStart: "2026-07-01T00:00",
        rangeEnd: "2026-08-01T00:00",
        timezone: "UTC",
        selectedProjectId: "",
      },
    });
    await flushPromises();
    expect(wrapper.findAll("ol > li")).toHaveLength(3);
    expect(wrapper.get('button[type="submit"]').text()).toContain(
      "Télécharger le fichier ICS",
    );
    expect(wrapper.text()).toContain(
      "Les commentaires et textes privés sont exclus",
    );
  });
});
