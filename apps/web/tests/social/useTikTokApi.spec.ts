import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useTikTokApi", () => {
  beforeEach(() => apiMock.mockReset().mockResolvedValue({ data: {} }));

  it("starts protected OAuth", async () => {
    await useTikTokApi(apiMock as typeof $fetch).startOAuth({});
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(2, "/social/tiktok/oauth/start", {
      method: "POST",
      body: {},
    });
  });

  it("schedules and retries through CSRF-protected endpoints", async () => {
    const api = useTikTokApi(apiMock as typeof $fetch);
    await api.schedule("publication-id", {
      accountId: "account-id",
      privacyLevel: "SELF_ONLY",
      caption: "Description",
      disableComment: false,
      disableDuet: false,
      disableStitch: false,
      brandContentToggle: false,
      brandOrganicToggle: true,
      isAigc: false,
      runAt: "2026-07-23T10:00:00.000Z",
    });
    await api.retry("schedule-id");
    await api.refresh("account-id");
    expect(apiMock).toHaveBeenCalledWith(
      "/social/tiktok/publications/publication-id/schedule",
      expect.objectContaining({ method: "POST" }),
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/social/tiktok/schedules/schedule-id/retry",
      { method: "POST" },
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/social/tiktok/accounts/account-id/refresh",
      { method: "POST" },
    );
  });
});
