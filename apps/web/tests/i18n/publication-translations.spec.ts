import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicationTranslations from "~/components/PublicationTranslations.vue";
import type { PublicationTranslation } from "~/types/translation";

const generated: PublicationTranslation = {
  id: "translation-id",
  publicationId: "publication-id",
  sourceLocale: "fr",
  targetLocale: "en",
  sourceVersion: 2,
  text: "Generated English translation.",
  status: "draft",
  generatedByAi: true,
  provider: "mock",
  model: "mock-text-v1",
  createdBy: "user-id",
  approvedBy: null,
  approvedAt: null,
  createdAt: "2026-07-23T10:00:00.000Z",
  updatedAt: "2026-07-23T10:00:00.000Z",
};

const { translationApi } = vi.hoisted(() => ({
  translationApi: {
    list: vi.fn(),
    generate: vi.fn(),
    update: vi.fn(),
    approve: vi.fn(),
  },
}));
mockNuxtImport("useTranslationsApi", () => () => translationApi);

describe("PublicationTranslations", () => {
  beforeEach(() => {
    clearNuxtState();
    for (const method of Object.values(translationApi)) method.mockReset();
    translationApi.list.mockResolvedValue({
      data: [],
      meta: { sourceText: "Texte source.", sourceVersion: 2 },
    });
  });

  it("keeps source visible and requires a separate human approval", async () => {
    translationApi.generate.mockResolvedValue({ data: generated });
    translationApi.approve.mockResolvedValue({
      data: {
        ...generated,
        status: "approved",
        approvedBy: "user-id",
        approvedAt: "2026-07-23T10:01:00.000Z",
      },
    });
    const wrapper = await mountSuspended(PublicationTranslations, {
      props: {
        publicationId: "publication-id",
        sourceText: "Texte source.",
        contentVersion: 2,
        role: "agency",
      },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("Texte source.");
    expect(wrapper.get('article[lang="fr"]').exists()).toBe(true);

    await wrapper
      .findAll("button")
      .find((button) => button.text().includes("Générer"))!
      .trigger("click");
    await flushPromises();
    expect(wrapper.get("textarea").element.value).toBe(
      "Generated English translation.",
    );
    expect(wrapper.text()).toContain("validation humaine");
    expect(translationApi.approve).not.toHaveBeenCalled();

    await wrapper
      .findAll("button")
      .find((button) => button.text().includes("Approuver"))!
      .trigger("click");
    await flushPromises();
    expect(translationApi.approve).toHaveBeenCalledWith(
      "publication-id",
      "en",
      2,
    );
    expect(wrapper.text()).toContain("Traduction approuvée.");
  });

  it("renders an accessible read-only translation for clients", async () => {
    translationApi.list.mockResolvedValueOnce({
      data: [{ ...generated, status: "approved" }],
      meta: { sourceText: "Texte source.", sourceVersion: 2 },
    });
    const wrapper = await mountSuspended(PublicationTranslations, {
      props: {
        publicationId: "publication-id",
        sourceText: "Texte source.",
        contentVersion: 2,
        role: "client",
      },
    });
    await flushPromises();
    expect(wrapper.get("textarea").attributes("readonly")).toBeDefined();
    expect(wrapper.findAll(".page-actions button")).toHaveLength(0);
    expect(wrapper.get('[lang="en"]').exists()).toBe(true);
  });
});
