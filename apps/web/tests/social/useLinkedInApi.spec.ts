import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useLinkedInApi", () => {
  beforeEach(() => apiMock.mockReset().mockResolvedValue({ data: {} }));

  it("starts protected OAuth for an explicitly selected professional account", async () => {
    await useLinkedInApi(apiMock as typeof $fetch).startOAuth({
      organizationId: "123456789",
    });
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(2, "/social/linkedin/oauth/start", {
      method: "POST",
      body: { organizationId: "123456789" },
    });
  });

  it("schedules and retries through CSRF-protected endpoints", async () => {
    const api = useLinkedInApi(apiMock as typeof $fetch);
    await api.schedule("publication-id", {
      accountId: "account-id",
      runAt: "2026-07-23T10:00:00.000Z",
    });
    await api.retry("schedule-id");
    await api.refresh("account-id");
    expect(apiMock).toHaveBeenCalledWith(
      "/social/linkedin/publications/publication-id/schedule",
      expect.objectContaining({ method: "POST" }),
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/social/linkedin/schedules/schedule-id/retry",
      { method: "POST" },
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/social/linkedin/accounts/account-id/refresh",
      { method: "POST" },
    );
  });
});
