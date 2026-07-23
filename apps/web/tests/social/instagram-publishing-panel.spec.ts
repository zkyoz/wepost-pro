import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import InstagramPublishingPanel from "~/components/InstagramPublishingPanel.vue";

const { instagramApi } = vi.hoisted(() => ({
  instagramApi: {
    status: vi.fn().mockResolvedValue({ data: null }),
    accounts: vi.fn().mockResolvedValue({
      data: [
        {
          id: "account-id",
          externalAccountId: "17841400000000000",
          externalAccountName: "@wepost_test",
          status: "connected",
        },
      ],
    }),
    validate: vi.fn(),
    schedule: vi.fn(),
    retry: vi.fn(),
  },
}));

mockNuxtImport("useInstagramApi", () => () => instagramApi);

describe("InstagramPublishingPanel", () => {
  it("offers accessible validation and scheduling controls to the agency", async () => {
    const wrapper = await mountSuspended(InstagramPublishingPanel, {
      props: {
        publicationId: "publication-id",
        role: "agency",
        status: "approved",
        scheduledAt: null,
      },
    });
    expect(wrapper.get('label[for="instagram-account"]').text()).toContain(
      "Compte Instagram professionnel",
    );
    expect(wrapper.text()).toContain("Valider pour Instagram");
    expect(wrapper.text()).toContain("Programmer sur Instagram");
    expect(wrapper.get('[aria-live="polite"]').exists()).toBe(true);
  });

  it("shows status without mutation controls to the client", async () => {
    const wrapper = await mountSuspended(InstagramPublishingPanel, {
      props: {
        publicationId: "publication-id",
        role: "client",
        status: "approved",
        scheduledAt: null,
      },
    });
    expect(wrapper.text()).toContain("Aucune programmation Instagram");
    expect(wrapper.text()).not.toContain("Programmer sur Instagram");
  });
});
