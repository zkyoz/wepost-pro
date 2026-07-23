import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useSupervisionApi", () => {
  beforeEach(() => apiMock.mockReset());

  it("uses the same bounded filters for summary and category lists", async () => {
    apiMock.mockResolvedValue({ data: {}, meta: {} });
    const api = useSupervisionApi(apiMock as typeof $fetch);
    const filters = {
      projectId: "project-id",
      network: "facebook" as const,
      from: "",
    };
    await api.summary(filters);
    await api.items("failed", filters, 2);

    expect(apiMock).toHaveBeenNthCalledWith(1, "/supervision/summary", {
      query: { projectId: "project-id", network: "facebook" },
    });
    expect(apiMock).toHaveBeenNthCalledWith(2, "/supervision/items", {
      query: {
        projectId: "project-id",
        network: "facebook",
        category: "failed",
        page: 2,
      },
    });
  });

  it("loads CSRF before marking an unread comment as read", async () => {
    apiMock.mockResolvedValue({ data: {} });
    await useSupervisionApi(apiMock as typeof $fetch).markCommentRead(
      "notification-id",
    );
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(
      2,
      "/supervision/notifications/notification-id/read",
      { method: "PATCH" },
    );
  });
});
