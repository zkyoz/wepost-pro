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
      "Profil ou Page LinkedIn",
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

  it("identifies a personal test profile in the account selector", async () => {
    linkedinApi.accounts.mockResolvedValueOnce({
      data: [
        {
          id: "person",
          externalAccountId: "urn:li:person:test",
          externalAccountName: "Profil de test",
          status: "connected",
          connectionMode: "mock",
        },
      ],
    });
    const wrapper = await mountSuspended(LinkedInPublishingPanel, {
      props: {
        publicationId: "publication",
        role: "agency",
        status: "approved",
        scheduledAt: null,
      },
    });
    expect(wrapper.get("option").text()).toContain(
      "Profil personnel (simulation)",
    );
  });

  it("requires confirmation before programming a real public post", async () => {
    linkedinApi.accounts.mockResolvedValueOnce({
      data: [
        {
          id: "person",
          externalAccountId: "urn:li:person:test",
          externalAccountName: "Mon profil",
          status: "connected",
          connectionMode: "live",
        },
      ],
    });
    const originalConfirm = window.confirm;
    const confirmation = vi.fn().mockReturnValue(false);
    window.confirm = confirmation;
    try {
      linkedinApi.schedule.mockClear();
      const wrapper = await mountSuspended(LinkedInPublishingPanel, {
        props: {
          publicationId: "publication",
          role: "agency",
          status: "approved",
          scheduledAt: null,
        },
      });
      await wrapper
        .findAll("button")
        .find((button) => button.text() === "Programmer sur LinkedIn")!
        .trigger("click");
      expect(confirmation).toHaveBeenCalledWith(
        expect.stringContaining("visible publiquement"),
      );
      expect(linkedinApi.schedule).not.toHaveBeenCalled();
    } finally {
      window.confirm = originalConfirm;
    }
  });

  it("refreshes a completed attempt and links to its real LinkedIn identifier", async () => {
    const state = {
      id: "schedule",
      publicationId: "publication",
      publicationVersion: 1,
      runAt: "2026-09-13T12:00:00Z",
      status: "queued",
      attempts: [],
    };
    linkedinApi.status
      .mockResolvedValueOnce({ data: state })
      .mockResolvedValueOnce({
        data: {
          ...state,
          status: "published",
          attempts: [
            {
              id: "attempt",
              attempt: 1,
              result: "success",
              startedAt: "2026-09-13T12:00:00Z",
              remotePostId: "urn:li:share:12345",
            },
          ],
        },
      });
    const wrapper = await mountSuspended(LinkedInPublishingPanel, {
      props: {
        publicationId: "publication",
        role: "client",
        status: "scheduled",
        scheduledAt: null,
      },
    });
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Actualiser le statut LinkedIn")!
      .trigger("click");
    await vi.waitFor(() => expect(wrapper.text()).toContain("Publiée"));
    expect(wrapper.get('a[target="_blank"]').attributes("href")).toBe(
      "https://www.linkedin.com/feed/update/urn:li:share:12345/",
    );
  });
});
