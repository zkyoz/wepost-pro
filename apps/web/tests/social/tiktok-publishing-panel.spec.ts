import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import TikTokPublishingPanel from "~/components/TikTokPublishingPanel.vue";

const { tiktokApi } = vi.hoisted(() => ({
  tiktokApi: {
    status: vi.fn().mockResolvedValue({ data: null }),
    accounts: vi.fn().mockResolvedValue({
      data: [
        {
          id: "account-id",
          externalAccountId: "123456789",
          externalAccountName: "Wepost Test",
          status: "connected",
          creatorInfo: {
            privacyLevelOptions: ["SELF_ONLY"],
            commentDisabled: false,
            duetDisabled: false,
            stitchDisabled: false,
            maxVideoPostDurationSec: 180,
          },
        },
      ],
    }),
    validate: vi.fn(),
    schedule: vi.fn(),
    retry: vi.fn(),
  },
}));

mockNuxtImport("useTikTokApi", () => () => tiktokApi);

describe("TikTokPublishingPanel", () => {
  it("offers accessible validation and scheduling controls to the agency", async () => {
    const wrapper = await mountSuspended(TikTokPublishingPanel, {
      props: {
        publicationId: "publication-id",
        role: "agency",
        status: "approved",
        scheduledAt: null,
        publicationTitle: "Campagne",
        publicationText: "Description du Pin",
      },
    });
    expect(wrapper.get('label[for="tiktok-account"]').text()).toContain(
      "Compte TikTok",
    );
    expect(wrapper.get('label[for="tiktok-privacy"]').text()).toContain(
      "Confidentialité",
    );
    expect(wrapper.text()).toContain("Valider pour TikTok");
    expect(wrapper.text()).toContain("Programmer sur TikTok");
    expect(wrapper.get('[aria-live="polite"]').exists()).toBe(true);
  });

  it("shows status without mutation controls to the client", async () => {
    const wrapper = await mountSuspended(TikTokPublishingPanel, {
      props: {
        publicationId: "publication-id",
        role: "client",
        status: "approved",
        scheduledAt: null,
        publicationTitle: "Campagne",
        publicationText: "Description du Pin",
      },
    });
    expect(wrapper.text()).toContain("Aucune programmation TikTok");
    expect(wrapper.text()).not.toContain("Programmer sur TikTok");
  });
});
