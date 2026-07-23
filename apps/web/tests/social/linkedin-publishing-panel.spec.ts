import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import LinkedInPublishingPanel from "~/components/LinkedInPublishingPanel.vue";

const { linkedinApi } = vi.hoisted(() => ({
  linkedinApi: {
    status: vi.fn().mockResolvedValue({ data: null }),
    accounts: vi.fn().mockResolvedValue({
      data: [
        {
          id: "account-id",
          externalAccountId: "123456789",
          externalAccountName: "Wepost Test",
          status: "connected",
        },
      ],
    }),
    validate: vi.fn(),
    schedule: vi.fn(),
    retry: vi.fn(),
  },
}));

mockNuxtImport("useLinkedInApi", () => () => linkedinApi);

describe("LinkedInPublishingPanel", () => {
  it("offers accessible validation and scheduling controls to the agency", async () => {
    const wrapper = await mountSuspended(LinkedInPublishingPanel, {
      props: {
        publicationId: "publication-id",
        role: "agency",
        status: "approved",
        scheduledAt: null,
      },
    });
    expect(wrapper.get('label[for="linkedin-account"]').text()).toContain(
      "Organisation LinkedIn",
    );
    expect(wrapper.text()).toContain("Valider pour LinkedIn");
    expect(wrapper.text()).toContain("Programmer sur LinkedIn");
    expect(wrapper.get('[aria-live="polite"]').exists()).toBe(true);
  });

  it("shows status without mutation controls to the client", async () => {
    const wrapper = await mountSuspended(LinkedInPublishingPanel, {
      props: {
        publicationId: "publication-id",
        role: "client",
        status: "approved",
        scheduledAt: null,
      },
    });
    expect(wrapper.text()).toContain("Aucune programmation LinkedIn");
    expect(wrapper.text()).not.toContain("Programmer sur LinkedIn");
  });
});
