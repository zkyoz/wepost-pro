import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useFacebookApi", () => {
  beforeEach(() => apiMock.mockReset().mockResolvedValue({ data: {} }));

  it("starts protected OAuth for an explicitly selected Page", async () => {
    await useFacebookApi(apiMock as typeof $fetch).startOAuth({
      pageId: "1234567890",
    });
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(2, "/social/facebook/oauth/start", {
      method: "POST",
      body: { pageId: "1234567890" },
    });
  });

  it("schedules and retries through CSRF-protected endpoints", async () => {
    const api = useFacebookApi(apiMock as typeof $fetch);
    await api.schedule("publication-id", {
      accountId: "account-id",
      runAt: "2026-07-23T10:00:00.000Z",
    });
    await api.retry("schedule-id");
    expect(apiMock).toHaveBeenCalledWith(
      "/social/facebook/publications/publication-id/schedule",
      expect.objectContaining({ method: "POST" }),
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/social/facebook/schedules/schedule-id/retry",
      { method: "POST" },
    );
  });
});
