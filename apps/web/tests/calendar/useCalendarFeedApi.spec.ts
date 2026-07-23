import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useCalendarFeedApi", () => {
  beforeEach(() => apiMock.mockReset().mockResolvedValue({ data: [] }));

  it("downloads, creates, lists and revokes through the protected API", async () => {
    const api = useCalendarFeedApi(apiMock as typeof $fetch);
    await api.download({
      start: "2026-07-01T00:00",
      end: "2026-08-01T00:00",
      timezone: "Europe/Paris",
      projectId: "project-id",
    });
    await api.list();
    await api.create("project-id");
    await api.revoke("feed-id");

    expect(apiMock).toHaveBeenNthCalledWith(1, "/calendar/export.ics", {
      query: {
        start: "2026-07-01T00:00",
        end: "2026-08-01T00:00",
        timezone: "Europe/Paris",
        projectId: "project-id",
      },
      responseType: "blob",
    });
    expect(apiMock).toHaveBeenNthCalledWith(2, "/calendar/feeds");
    expect(apiMock).toHaveBeenNthCalledWith(3, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(4, "/calendar/feeds", {
      method: "POST",
      body: { projectId: "project-id" },
    });
    expect(apiMock).toHaveBeenNthCalledWith(5, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(6, "/calendar/feeds/feed-id", {
      method: "DELETE",
    });
  });

  it("builds the public URL on the API origin", () => {
    expect(
      absoluteCalendarFeedUrl(
        "/api/v1/calendar/feeds/secret",
        "https://api.wepost.pro/api/v1",
      ),
    ).toBe("https://api.wepost.pro/api/v1/calendar/feeds/secret");
  });
});
