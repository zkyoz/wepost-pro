import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicationNetworkVariants from "~/components/PublicationNetworkVariants.vue";
import type { NetworkVariant } from "~/types/network-variant";

const variant: NetworkVariant = {
  id: "variant-id",
  publicationId: "publication-id",
  network: "linkedin",
  sourceVersion: 2,
  text: "Variante LinkedIn",
  status: "draft",
  generatedByAi: true,
  createdBy: "user-id",
  approvedBy: null,
  approvedAt: null,
  staleAt: null,
  createdAt: "2026-07-23T00:00:00.000Z",
  updatedAt: "2026-07-23T00:00:00.000Z",
  textLimit: null,
};

const { variantApi } = vi.hoisted(() => ({
  variantApi: {
    list: vi.fn(),
    effective: vi.fn(),
    create: vi.fn(),
    generate: vi.fn(),
    update: vi.fn(),
    approve: vi.fn(),
    markStale: vi.fn(),
  },
}));

mockNuxtImport("useNetworkVariantsApi", () => () => variantApi);

describe("PublicationNetworkVariants", () => {
  beforeEach(() => {
    for (const value of Object.values(variantApi)) value.mockReset();
    variantApi.list.mockResolvedValue({
      data: [variant],
      meta: {
        sourceVersion: 2,
        sourceText: "Texte source",
        limits: { facebook: null, linkedin: null },
      },
    });
  });

  it("offers keyboard tabs, textual diff, manual editing and explicit approval", async () => {
    variantApi.update.mockResolvedValue({
      data: { ...variant, text: "Variante relue" },
    });
    variantApi.approve.mockResolvedValue({
      data: { ...variant, text: "Variante relue", status: "approved" },
    });
    const wrapper = await mountSuspended(PublicationNetworkVariants, {
      props: {
        publicationId: "publication-id",
        sourceText: "Texte source",
        contentVersion: 2,
        targetNetworks: ["facebook", "linkedin"],
        role: "agency",
        publicationStatus: "approved",
      },
    });
    await flushPromises();
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs).toHaveLength(2);
    await tabs[0]!.trigger("keydown", { key: "ArrowRight" });
    expect(wrapper.get('[aria-selected="true"]').text()).toContain("LinkedIn");
    expect(wrapper.get('[aria-label="Comparaison textuelle"]').exists()).toBe(
      true,
    );
    expect(wrapper.text()).toContain("Texte source — version 2");

    await wrapper.get("textarea").setValue("Variante relue");
    await wrapper.get(".network-editor button").trigger("click");
    await flushPromises();
    expect(variantApi.update).toHaveBeenCalledWith(
      "variant-id",
      "Variante relue",
    );
    await wrapper.get(".network-panel > .button-primary").trigger("click");
    await flushPromises();
    expect(variantApi.approve).toHaveBeenCalledWith("variant-id");
    expect(wrapper.text()).toContain("Variante LinkedIn approuvée");
  });

  it("explains stale fallback without exposing edit controls to clients", async () => {
    variantApi.list.mockResolvedValueOnce({
      data: [{ ...variant, sourceVersion: 1, status: "stale" }],
      meta: { sourceVersion: 2, sourceText: "Texte source", limits: {} },
    });
    const wrapper = await mountSuspended(PublicationNetworkVariants, {
      props: {
        publicationId: "publication-id",
        sourceText: "Texte source",
        contentVersion: 2,
        targetNetworks: ["linkedin"],
        role: "client",
        publicationStatus: "approved",
      },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("le texte source reste le fallback");
    expect(wrapper.find("textarea").exists()).toBe(false);
  });
});
