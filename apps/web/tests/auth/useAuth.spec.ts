import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicUser } from "~/types/auth";

const apiMock = vi.fn();

const profile: PublicUser = {
  id: "8fc4e41c-6298-48d3-bfe2-d4ea9c18e2c2",
  agencyId: null,
  email: "martin@example.com",
  displayName: "Martin Barre",
  role: "client",
  locale: "fr",
  isActive: true,
  initials: "MB",
  createdAt: "2026-07-22T10:00:00.000Z",
  updatedAt: "2026-07-22T10:00:00.000Z",
};

describe("useAuth", () => {
  beforeEach(() => {
    clearNuxtState();
    apiMock.mockReset();
  });

  it("starts unauthenticated", () => {
    const auth = useAuth(apiMock as typeof $fetch);
    expect(auth.user.value).toBeNull();
    expect(auth.isAuthenticated.value).toBe(false);
  });

  it("restores the current user from /auth/me", async () => {
    apiMock.mockResolvedValueOnce({ data: profile });
    const auth = useAuth(apiMock as typeof $fetch);
    await auth.fetchCurrentUser();
    expect(apiMock).toHaveBeenCalledWith("/auth/me");
    expect(auth.user.value).toEqual(profile);
    expect(auth.isAuthenticated.value).toBe(true);
  });

  it("clears the user when the session has expired", async () => {
    apiMock.mockRejectedValueOnce({ statusCode: 401 });
    const auth = useAuth(apiMock as typeof $fetch);
    const result = await auth.fetchCurrentUser();
    expect(result).toBeNull();
    expect(auth.user.value).toBeNull();
  });

  it("rethrows an unavailable API error and always clears loading", async () => {
    const unavailable = { statusCode: 503 };
    apiMock.mockRejectedValueOnce(unavailable);
    const auth = useAuth(apiMock as typeof $fetch);
    await expect(auth.fetchCurrentUser()).rejects.toBe(unavailable);
    expect(auth.isLoading.value).toBe(false);
    expect(auth.hasLoaded.value).toBe(true);
  });

  it("gets a CSRF cookie then logs in without storing a token", async () => {
    apiMock
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ data: profile });
    const auth = useAuth(apiMock as typeof $fetch);
    await auth.login({ email: profile.email, password: "password-value" });
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(2, "/auth/login", {
      method: "POST",
      body: { email: profile.email, password: "password-value" },
    });
    expect(auth.user.value).toEqual(profile);
  });

  it("gets a CSRF cookie then registers the public profile", async () => {
    apiMock
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ data: profile });
    const auth = useAuth(apiMock as typeof $fetch);
    const payload = {
      displayName: profile.displayName,
      email: profile.email,
      password: "correct-horse-battery-staple",
      passwordConfirmation: "correct-horse-battery-staple",
    };
    await auth.register(payload);
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(2, "/auth/register", {
      method: "POST",
      body: payload,
    });
    expect(auth.user.value).toEqual(profile);
    expect(auth.hasLoaded.value).toBe(true);
  });

  it("clears local auth state after logout", async () => {
    apiMock.mockResolvedValue(undefined);
    const auth = useAuth(apiMock as typeof $fetch);
    auth.user.value = profile;
    await auth.logout();
    expect(apiMock).toHaveBeenLastCalledWith("/auth/logout", {
      method: "POST",
    });
    expect(auth.user.value).toBeNull();
  });

  it("persists the locale through the authenticated API", async () => {
    apiMock
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ data: { ...profile, locale: "en" } });
    const auth = useAuth(apiMock as typeof $fetch);
    auth.user.value = profile;
    await auth.updateLocale("en");
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(2, "/users/me/locale", {
      method: "PATCH",
      body: { locale: "en" },
    });
    expect(auth.user.value?.locale).toBe("en");
    expect(useLocale().locale.value).toBe("en");
  });
});
