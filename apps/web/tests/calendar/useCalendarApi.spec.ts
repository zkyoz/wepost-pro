import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useCalendarApi", () => {
  beforeEach(() => apiMock.mockReset().mockResolvedValue({ data: [] }));

  it("sends the range, pagination and validated filters", async () => {
    await useCalendarApi(apiMock as typeof $fetch).list({
      start: "2026-07-01T00:00",
      end: "2026-08-01T00:00",
      timezone: "Europe/Paris",
      projectId: "project-id",
      network: "linkedin",
      status: "approved",
      includeUndated: true,
      page: 2,
      perPage: 100,
    });
    expect(apiMock).toHaveBeenCalledWith("/calendar", {
      query: {
        start: "2026-07-01T00:00",
        end: "2026-08-01T00:00",
        timezone: "Europe/Paris",
        projectId: "project-id",
        network: "linkedin",
        status: "approved",
        includeUndated: true,
        page: 2,
        perPage: 100,
      },
    });
  });

  it("gets CSRF protection and carries the expected version when moving", async () => {
    await useCalendarApi(apiMock as typeof $fetch).move("publication-id", {
      contentVersion: 4,
      scheduledAt: "2026-07-24T10:00",
      timezone: "Europe/Paris",
    });
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(
      2,
      "/publications/publication-id/calendar/move",
      {
        method: "POST",
        body: {
          contentVersion: 4,
          scheduledAt: "2026-07-24T10:00",
          timezone: "Europe/Paris",
        },
      },
    );
  });
});
