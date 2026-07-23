import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useAdminApi", () => {
  it("loads the read-only backup history", async () => {
    apiMock.mockResolvedValue({ data: [], summary: {} });
    const api = useAdminApi(apiMock as typeof $fetch);
    await api.backups({ page: 2 });
    expect(apiMock).toHaveBeenCalledWith("/admin/backups", {
      query: { page: 2 },
    });
  });

  beforeEach(() => apiMock.mockReset());

  it("passes pagination and filters to global resources", async () => {
    apiMock.mockResolvedValue({ data: [], meta: {} });
    await useAdminApi(apiMock as typeof $fetch).resourceList("incidents", {
      page: 2,
      result: "permanent_failure",
    });
    expect(apiMock).toHaveBeenCalledWith("/admin/incidents", {
      query: { page: 2, result: "permanent_failure" },
    });
  });

  it("loads CSRF before every destructive administration action", async () => {
    apiMock.mockResolvedValue({ data: {} });
    await useAdminApi(apiMock as typeof $fetch).changeArchiveState(
      "projects",
      "project-id",
      "archive",
    );
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(
      2,
      "/admin/projects/project-id/archive",
      {
        method: "POST",
      },
    );
  });

  it("changes only the dedicated user status field", async () => {
    apiMock.mockResolvedValue({ data: {} });
    await useAdminApi(apiMock as typeof $fetch).updateUserStatus(
      "user-id",
      false,
    );
    expect(apiMock).toHaveBeenLastCalledWith("/admin/users/user-id/status", {
      method: "PATCH",
      body: { isActive: false },
    });
  });
});
