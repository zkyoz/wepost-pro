import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MediaAnnotations from "~/components/MediaAnnotations.vue";
import type { MediaAnnotation } from "~/types/annotation";

const existing: MediaAnnotation = {
  id: "annotation-old",
  publicationId: "publication-id",
  mediaId: "media-id",
  mediaVersion: "a".repeat(64),
  commentId: null,
  publicationVersion: 1,
  author: { id: "client-id", displayName: "Client test" },
  shape: "point",
  x: 0.2,
  y: 0.3,
  width: null,
  height: null,
  body: "<img src=x onerror=alert(1)> Ancienne remarque",
  createdAt: "2026-07-23T00:00:00.000Z",
  updatedAt: "2026-07-23T00:00:00.000Z",
  deletedAt: null,
  historical: true,
  canEdit: false,
  canDelete: false,
};

const { annotationsApi } = vi.hoisted(() => ({
  annotationsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

mockNuxtImport("useAnnotationsApi", () => () => annotationsApi);

describe("MediaAnnotations", () => {
  beforeEach(() => {
    for (const method of Object.values(annotationsApi)) method.mockReset();
    annotationsApi.list.mockResolvedValue({
      data: [existing],
      meta: {
        currentPublicationVersion: 2,
        mediaVersion: "a".repeat(64),
        mediaCurrentlyAttached: true,
        openCount: 0,
      },
    });
  });

  it("renders plain-text history and a complete keyboard coordinate form", async () => {
    const wrapper = await mountSuspended(MediaAnnotations, {
      props: {
        publicationId: "publication-id",
        contentVersion: 2,
        media: {
          id: "media-id",
          originalName: "visuel.png",
          mimeType: "image/png",
          readUrl: "https://storage.test/signed",
          altText: "Visuel de campagne",
          isDecorative: false,
        },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Historique — version 1");
    expect(wrapper.html()).toContain("&lt;img src=x");
    expect(wrapper.html()).not.toContain("<img src=x");
    expect(wrapper.get("fieldset").text()).toContain(
      "Alternative clavier complète",
    );
    expect(wrapper.findAll('input[type="number"]')).toHaveLength(2);
    await wrapper.get("select").setValue("rectangle");
    expect(wrapper.findAll('input[type="number"]')).toHaveLength(4);
  });

  it("creates a normalized point and announces it in the textual list", async () => {
    const created = {
      ...existing,
      id: "annotation-new",
      publicationVersion: 2,
      body: "Décaler le logo",
      historical: false,
      canEdit: true,
      canDelete: true,
    };
    annotationsApi.create.mockResolvedValue({ data: created });
    const wrapper = await mountSuspended(MediaAnnotations, {
      props: {
        publicationId: "publication-id",
        contentVersion: 2,
        media: {
          id: "media-id",
          originalName: "visuel.png",
          mimeType: "image/png",
          readUrl: "https://storage.test/signed",
          altText: "Visuel de campagne",
          isDecorative: false,
        },
      },
    });
    await flushPromises();
    await wrapper.get("textarea").setValue("Décaler le logo");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(annotationsApi.create).toHaveBeenCalledWith(
      "publication-id",
      "media-id",
      {
        shape: "point",
        x: 0.5,
        y: 0.5,
        width: null,
        height: null,
        body: "Décaler le logo",
      },
    );
    expect(wrapper.text()).toContain("L’annotation 2 a été ajoutée");
    expect(wrapper.get("#annotation-annotation-new").text()).toContain(
      "Décaler le logo",
    );
  });
});
