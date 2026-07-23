import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import PinterestPublishingPanel from "~/components/PinterestPublishingPanel.vue";

const { pinterestApi } = vi.hoisted(() => ({
  pinterestApi: {
    status: vi.fn().mockResolvedValue({ data: null }),
    accounts: vi.fn().mockResolvedValue({
      data: [
        {
          id: "account-id",
          externalAccountId: "123456789",
          externalAccountName: "Wepost Test",
          status: "connected",
          boards: [{ id: "123456789", name: "Campagnes", privacy: "PUBLIC" }],
        },
      ],
    }),
    validate: vi.fn(),
    schedule: vi.fn(),
    retry: vi.fn(),
  },
}));

mockNuxtImport("usePinterestApi", () => () => pinterestApi);

describe("PinterestPublishingPanel", () => {
  it("offers accessible validation and scheduling controls to the agency", async () => {
    const wrapper = await mountSuspended(PinterestPublishingPanel, {
      props: {
        publicationId: "publication-id",
        role: "agency",
        status: "approved",
        scheduledAt: null,
        publicationTitle: "Campagne",
        publicationText: "Description du Pin",
      },
    });
    expect(wrapper.get('label[for="pinterest-account"]').text()).toContain(
      "Compte Pinterest",
    );
    expect(wrapper.get('label[for="pinterest-board"]').text()).toContain(
      "Tableau Pinterest",
    );
    expect(wrapper.text()).toContain("Valider pour Pinterest");
    expect(wrapper.text()).toContain("Programmer sur Pinterest");
    expect(wrapper.get('[aria-live="polite"]').exists()).toBe(true);
  });

  it("shows status without mutation controls to the client", async () => {
    const wrapper = await mountSuspended(PinterestPublishingPanel, {
      props: {
        publicationId: "publication-id",
        role: "client",
        status: "approved",
        scheduledAt: null,
        publicationTitle: "Campagne",
        publicationText: "Description du Pin",
      },
    });
    expect(wrapper.text()).toContain("Aucune programmation Pinterest");
    expect(wrapper.text()).not.toContain("Programmer sur Pinterest");
  });
});
