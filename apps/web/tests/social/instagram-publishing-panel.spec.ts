import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import InstagramPublishingPanel from "~/components/InstagramPublishingPanel.vue";
import { flushPromises } from "@vue/test-utils";

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
  it("only unlocks a legacy partial delivery after successful server validation", async () => {
    instagramApi.validate.mockResolvedValueOnce({
      data: { valid: false, errors: ["Validation requise"], warnings: [] },
    });
    const wrapper = await mountSuspended(InstagramPublishingPanel, {
      props: {
        publicationId: "publication",
        role: "agency",
        status: "published",
        scheduledAt: null,
      },
    });
    const program = () =>
      wrapper
        .findAll("button")
        .find((button) => button.text() === "Programmer sur Instagram")!;
    const validate = () =>
      wrapper
        .findAll("button")
        .find((button) => button.text() === "Valider pour Instagram")!;
    expect(program().attributes("disabled")).toBeDefined();
    await validate().trigger("click");
    await vi.waitFor(() => expect(instagramApi.validate).toHaveBeenCalled());
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Validation requise"),
    );
    expect(program().attributes("disabled")).toBeDefined();
    instagramApi.validate.mockResolvedValueOnce({
      data: { valid: true, errors: [], warnings: [] },
    });
    await validate().trigger("click");
    await vi.waitFor(() =>
      expect(program().attributes("disabled")).toBeUndefined(),
    );
  });

  it("does not publish a real account when confirmation is declined", async () => {
    instagramApi.accounts.mockResolvedValueOnce({
      data: [
        {
          id: "real-account",
          externalAccountId: "17841400000000000",
          externalAccountName: "@test",
          status: "connected",
          mode: "live",
        },
      ],
    });
    const originalConfirm = window.confirm;
    const confirm = vi.fn().mockReturnValue(false);
    window.confirm = confirm;
    try {
      const wrapper = await mountSuspended(InstagramPublishingPanel, {
        props: {
          publicationId: "publication",
          role: "agency",
          status: "approved",
          scheduledAt: null,
        },
      });
      await wrapper
        .findAll("button")
        .find((button) => button.text() === "Programmer sur Instagram")!
        .trigger("click");
      await flushPromises();
      expect(confirm).toHaveBeenCalledWith(expect.stringContaining("@test"));
      expect(instagramApi.schedule).not.toHaveBeenCalled();
    } finally {
      window.confirm = originalConfirm;
    }
  });
  it("refreshes a queued publication without sending another job", async () => {
    instagramApi.status.mockResolvedValueOnce({
      data: {
        id: "schedule",
        status: "queued",
        publicationVersion: 1,
        runAt: "2026-09-13T12:00:00Z",
        attempts: [],
      },
    });
    const wrapper = await mountSuspended(InstagramPublishingPanel, {
      props: {
        publicationId: "publication",
        role: "client",
        status: "scheduled",
        scheduledAt: null,
      },
    });
    instagramApi.status.mockResolvedValueOnce({
      data: {
        id: "schedule",
        status: "published",
        publicationVersion: 1,
        runAt: "2026-09-13T12:00:00Z",
        attempts: [],
      },
    });
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Actualiser le statut Instagram")!
      .trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("Statut Instagram : Publiée.");
    expect(wrapper.emitted("refreshed")).toHaveLength(1);
    expect(instagramApi.schedule).not.toHaveBeenCalled();
  });
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
