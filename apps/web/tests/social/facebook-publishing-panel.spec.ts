import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import FacebookPublishingPanel from "~/components/FacebookPublishingPanel.vue";

const { facebookApi } = vi.hoisted(() => ({
  facebookApi: {
    status: vi.fn().mockResolvedValue({ data: null }),
    accounts: vi.fn().mockResolvedValue({
      data: [
        {
          id: "account-id",
          externalAccountId: "1234567890",
          externalAccountName: "Page de test",
          status: "connected",
        },
      ],
    }),
    validate: vi.fn(),
    schedule: vi.fn(),
    retry: vi.fn(),
  },
}));

mockNuxtImport("useFacebookApi", () => () => facebookApi);

describe("FacebookPublishingPanel", () => {
  it("offers accessible validation and scheduling controls to the agency", async () => {
    const wrapper = await mountSuspended(FacebookPublishingPanel, {
      props: {
        publicationId: "publication-id",
        role: "agency",
        status: "approved",
        scheduledAt: null,
      },
    });
    expect(wrapper.get('label[for="facebook-account"]').text()).toContain(
      "Page Facebook",
    );
    expect(wrapper.text()).toContain("Valider pour Facebook");
    expect(wrapper.text()).toContain("Programmer sur Facebook");
    expect(wrapper.get('[aria-live="polite"]').exists()).toBe(true);
  });

  it("shows status without mutation controls to the client", async () => {
    const wrapper = await mountSuspended(FacebookPublishingPanel, {
      props: {
        publicationId: "publication-id",
        role: "client",
        status: "approved",
        scheduledAt: null,
      },
    });
    expect(wrapper.text()).toContain("Aucune programmation Facebook");
    expect(wrapper.text()).not.toContain("Programmer sur Facebook");
  });
});
