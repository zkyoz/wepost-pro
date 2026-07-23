import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AiTextAssistant from "~/components/AiTextAssistant.vue";
import type { AiGeneration } from "~/types/ai";

const generated: AiGeneration = {
  id: "generation-id",
  publicationId: "publication-id",
  provider: "mock",
  model: "mock-text-v1",
  promptVersion: "text-v1",
  status: "completed",
  variants: [
    { id: "variant-1", text: "Première proposition" },
    { id: "variant-2", text: "Deuxième proposition" },
    { id: "variant-3", text: "Troisième proposition" },
  ],
  warnings: [],
  usage: { latencyMs: 12 },
  errorCode: null,
  appliedVariantId: null,
  createdAt: "2026-07-23T00:00:00.000Z",
  completedAt: "2026-07-23T00:00:01.000Z",
  cancelledAt: null,
  appliedAt: null,
};

const { aiApi } = vi.hoisted(() => ({
  aiApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn(),
    get: vi.fn(),
    apply: vi.fn(),
    cancel: vi.fn(),
  },
}));

mockNuxtImport("useAiGenerationApi", () => () => aiApi);

describe("AiTextAssistant", () => {
  beforeEach(() => {
    for (const value of Object.values(aiApi)) value.mockReset();
    aiApi.list.mockResolvedValue({ data: [] });
  });

  it("announces generation and requires an explicit accessible apply action", async () => {
    aiApi.create.mockResolvedValueOnce({ data: generated });
    aiApi.apply.mockResolvedValueOnce({
      data: {
        generation: { ...generated, appliedVariantId: "variant-1" },
        publication: {
          id: "publication-id",
          agencyId: "agency-id",
          projectId: "project-id",
          title: "Publication",
          baseText: "Première proposition",
          status: "draft",
          targetNetworks: ["linkedin"],
          scheduledAt: null,
          timezone: "Europe/Paris",
          contentVersion: 2,
          approvedVersion: null,
          createdBy: "user-id",
          updatedBy: "user-id",
          createdAt: "2026-07-23T00:00:00.000Z",
          updatedAt: "2026-07-23T00:00:01.000Z",
          archivedAt: null,
        },
      },
    });
    const wrapper = await mountSuspended(AiTextAssistant, {
      props: { publicationId: "publication-id", contentVersion: 1 },
    });
    await flushPromises();
    expect(wrapper.get('label[for="ai-brief"]').text()).toContain(
      "Brief de génération",
    );
    expect(wrapper.get('[aria-live="polite"]').exists()).toBe(true);

    await wrapper.get("#ai-brief").setValue("Présenter une offre responsable.");
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    expect(wrapper.findAll(".ai-generated-mark")).toHaveLength(3);
    expect(wrapper.text()).toContain("Validation humaine obligatoire");
    expect(wrapper.text()).toContain("Contenu généré · proposition 1");

    await wrapper.get(".ai-variants button").trigger("click");
    await flushPromises();
    expect(aiApi.apply).toHaveBeenCalledWith("generation-id", "variant-1", 1);
    expect(wrapper.emitted("applied")).toHaveLength(1);
    expect(wrapper.text()).toContain("Elle reste à valider avant publication");
  });

  it("shows loading history without creating content automatically", async () => {
    aiApi.list.mockResolvedValueOnce({ data: [generated] });
    const wrapper = await mountSuspended(AiTextAssistant, {
      props: { publicationId: "publication-id", contentVersion: 1 },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("Historique des générations (1)");
    expect(aiApi.create).not.toHaveBeenCalled();
  });
});
