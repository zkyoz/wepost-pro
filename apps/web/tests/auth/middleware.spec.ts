import { describe, expect, it, vi } from "vitest";
import authMiddleware from "~/middleware/auth";
import guestMiddleware from "~/middleware/guest";
import roleMiddleware from "~/middleware/role";

const { navigateMock, useAuthMock } = vi.hoisted(() => ({
  navigateMock: vi.fn((target) => target),
  useAuthMock: vi.fn(),
}));
mockNuxtImport("navigateTo", () => navigateMock);
mockNuxtImport("useAuth", () => useAuthMock);

describe("auth middleware", () => {
  it("redirects an anonymous user and preserves the requested path", async () => {
    useAuthMock.mockReturnValue({
      fetchCurrentUser: vi.fn(),
      hasLoaded: ref(true),
      isAuthenticated: ref(false),
    });
    const result = await authMiddleware(
      { fullPath: "/dashboard" } as never,
      {} as never,
    );
    expect(result).toEqual({
      path: "/auth/login",
      query: { redirect: "/dashboard", reason: "session-expired" },
    });
  });

  it("allows an authenticated user", async () => {
    useAuthMock.mockReturnValue({
      fetchCurrentUser: vi.fn(),
      hasLoaded: ref(true),
      isAuthenticated: ref(true),
    });
    const result = await authMiddleware(
      { fullPath: "/dashboard" } as never,
      {} as never,
    );
    expect(result).toBeUndefined();
  });

  it("redirects to login when restoring auth fails", async () => {
    useAuthMock.mockReturnValue({
      fetchCurrentUser: vi.fn().mockRejectedValue(new Error("unavailable")),
      hasLoaded: ref(false),
      isAuthenticated: ref(false),
    });
    const result = await authMiddleware(
      { fullPath: "/dashboard" } as never,
      {} as never,
    );
    expect(result).toEqual({
      path: "/auth/login",
      query: { reason: "api-unavailable" },
    });
  });
});

describe("guest middleware", () => {
  it("restores the session then redirects an authenticated user", async () => {
    const fetchCurrentUser = vi.fn().mockResolvedValue(undefined);
    useAuthMock.mockReturnValue({
      fetchCurrentUser,
      hasLoaded: ref(false),
      isAuthenticated: ref(true),
    });
    const result = await guestMiddleware({} as never, {} as never);
    expect(fetchCurrentUser).toHaveBeenCalledOnce();
    expect(result).toBe("/dashboard");
  });

  it("keeps the guest page when no session exists", async () => {
    useAuthMock.mockReturnValue({
      fetchCurrentUser: vi.fn(),
      hasLoaded: ref(true),
      isAuthenticated: ref(false),
    });
    expect(await guestMiddleware({} as never, {} as never)).toBeUndefined();
  });

  it("keeps the guest page when session restoration is unavailable", async () => {
    useAuthMock.mockReturnValue({
      fetchCurrentUser: vi.fn().mockRejectedValue(new Error("unavailable")),
      hasLoaded: ref(false),
      isAuthenticated: ref(false),
    });
    expect(await guestMiddleware({} as never, {} as never)).toBeUndefined();
  });
});

describe("role middleware", () => {
  it("allows a matching role", async () => {
    useAuthMock.mockReturnValue({
      user: ref({ role: "admin" }),
      fetchCurrentUser: vi.fn(),
      hasLoaded: ref(true),
    });
    const result = await roleMiddleware(
      { meta: { requiredRoles: ["admin"] } } as never,
      {} as never,
    );
    expect(result).toBeUndefined();
  });

  it("redirects a non-matching role", async () => {
    useAuthMock.mockReturnValue({
      user: ref({ role: "client" }),
      fetchCurrentUser: vi.fn(),
      hasLoaded: ref(true),
    });
    const result = await roleMiddleware(
      { meta: { requiredRoles: ["admin"] } } as never,
      {} as never,
    );
    expect(result).toBe("/access-denied");
  });

  it("denies by default when no role is declared", async () => {
    useAuthMock.mockReturnValue({
      user: ref({ role: "admin" }),
      fetchCurrentUser: vi.fn(),
      hasLoaded: ref(true),
    });
    const result = await roleMiddleware({ meta: {} } as never, {} as never);
    expect(result).toBe("/access-denied");
  });
});
