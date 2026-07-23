import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("usePinterestApi", () => {
  beforeEach(() => apiMock.mockReset().mockResolvedValue({ data: {} }));

  it("starts protected OAuth", async () => {
    await usePinterestApi(apiMock as typeof $fetch).startOAuth({});
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(
      2,
      "/social/pinterest/oauth/start",
      {
        method: "POST",
        body: {},
      },
    );
  });

  it("schedules and retries through CSRF-protected endpoints", async () => {
    const api = usePinterestApi(apiMock as typeof $fetch);
    await api.schedule("publication-id", {
      accountId: "account-id",
      boardId: "123456789",
      title: "Campagne",
      description: "Description",
      link: "https://wepost.pro",
      runAt: "2026-07-23T10:00:00.000Z",
    });
    await api.retry("schedule-id");
    await api.refresh("account-id");
    expect(apiMock).toHaveBeenCalledWith(
      "/social/pinterest/publications/publication-id/schedule",
      expect.objectContaining({ method: "POST" }),
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/social/pinterest/schedules/schedule-id/retry",
      { method: "POST" },
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/social/pinterest/accounts/account-id/refresh",
      { method: "POST" },
    );
  });
});
