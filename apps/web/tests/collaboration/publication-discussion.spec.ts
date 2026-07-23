import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import PublicationDiscussion from "~/components/PublicationDiscussion.vue";

const { collaborationApi } = vi.hoisted(() => ({
  collaborationApi: {
    discussion: vi.fn().mockResolvedValue({
      data: {
        comments: [
          {
            id: "comment-id",
            publicationId: "publication-id",
            author: { id: "author-id", displayName: "Client" },
            body: "<img src=x onerror=alert(1)>",
            createdAt: "2026-07-22T12:00:00.000Z",
            editedAt: null,
            deletedAt: null,
            canEdit: false,
            canDelete: false,
          },
        ],
        reviews: [],
      },
    }),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
    review: vi.fn(),
  },
}));

mockNuxtImport("useCollaborationApi", () => () => collaborationApi);

describe("PublicationDiscussion", () => {
  it("renders a semantic thread and escapes plain-text comments", async () => {
    const wrapper = await mountSuspended(PublicationDiscussion, {
      props: {
        publicationId: "publication-id",
        status: "awaiting_client_review",
        contentVersion: 2,
        role: "agency",
      },
    });
    expect(wrapper.get("ol.comment-thread article").text()).toContain(
      "<img src=x",
    );
    expect(wrapper.html()).toContain("&lt;img src=x");
    expect(wrapper.html()).not.toContain("<img src=x");
    expect(wrapper.get('[aria-live="polite"]').exists()).toBe(true);
  });

  it("exposes versioned review controls only to an assigned client role", async () => {
    const wrapper = await mountSuspended(PublicationDiscussion, {
      props: {
        publicationId: "publication-id",
        status: "awaiting_client_review",
        contentVersion: 2,
        role: "client",
      },
    });
    expect(wrapper.text()).toContain("Décision client sur la version 2");
    expect(wrapper.text()).toContain("Approuver cette version");
  });
});
