import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useInstagramApi", () => {
  beforeEach(() => apiMock.mockReset().mockResolvedValue({ data: {} }));

  it("starts protected OAuth for an explicitly selected professional account", async () => {
    await useInstagramApi(apiMock as typeof $fetch).startOAuth({
      instagramAccountId: "17841400000000000",
    });
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(
      2,
      "/social/instagram/oauth/start",
      {
        method: "POST",
        body: { instagramAccountId: "17841400000000000" },
      },
    );
  });

  it("schedules and retries through CSRF-protected endpoints", async () => {
    const api = useInstagramApi(apiMock as typeof $fetch);
    await api.schedule("publication-id", {
      accountId: "account-id",
      runAt: "2026-07-23T10:00:00.000Z",
    });
    await api.retry("schedule-id");
    expect(apiMock).toHaveBeenCalledWith(
      "/social/instagram/publications/publication-id/schedule",
      expect.objectContaining({ method: "POST" }),
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/social/instagram/schedules/schedule-id/retry",
      { method: "POST" },
    );
  });
});
