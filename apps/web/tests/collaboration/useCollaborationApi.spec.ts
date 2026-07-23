import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useCollaborationApi", () => {
  beforeEach(() => apiMock.mockReset().mockResolvedValue({ data: {} }));

  it("loads the discussion and sends comments with CSRF protection", async () => {
    const api = useCollaborationApi(apiMock as typeof $fetch);
    await api.discussion("publication-id");
    await api.createComment("publication-id", "Commentaire");

    expect(apiMock).toHaveBeenNthCalledWith(
      1,
      "/publications/publication-id/discussion",
    );
    expect(apiMock).toHaveBeenNthCalledWith(2, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(
      3,
      "/publications/publication-id/comments",
      {
        method: "POST",
        body: { body: "Commentaire" },
      },
    );
  });

  it("sends an exact version with the client review", async () => {
    await useCollaborationApi(apiMock as typeof $fetch).review(
      "publication-id",
      4,
      "changes_requested",
      "Corriger le titre",
    );
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(
      2,
      "/publications/publication-id/reviews",
      {
        method: "POST",
        body: {
          contentVersion: 4,
          decision: "changes_requested",
          message: "Corriger le titre",
        },
      },
    );
  });

  it("marks a notification read or unread", async () => {
    await useCollaborationApi(apiMock as typeof $fetch).markNotification(
      "notification-id",
      true,
    );
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(
      2,
      "/notifications/notification-id",
      {
        method: "PATCH",
        body: { read: true },
      },
    );
  });
});
