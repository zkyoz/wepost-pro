import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useProjectsApi", () => {
  beforeEach(() => apiMock.mockReset());

  it("passes search, status and pagination to the list endpoint", async () => {
    apiMock.mockResolvedValue({ data: [], meta: {} });
    await useProjectsApi(apiMock as typeof $fetch).list({
      page: 2,
      q: "été",
      status: "active",
    });
    expect(apiMock).toHaveBeenCalledWith("/projects", {
      query: { page: 2, q: "été", status: "active" },
    });
  });

  it("gets CSRF protection before a project mutation", async () => {
    apiMock.mockResolvedValue({ data: {} });
    const input = {
      name: "Projet test",
      description: "",
      clientUserId: "10000000-0000-4000-8000-000000000001",
      memberUserIds: [],
      timezone: "Europe/Paris",
    };
    await useProjectsApi(apiMock as typeof $fetch).create(input);
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(2, "/projects", {
      method: "POST",
      body: input,
    });
  });

  it("archives without issuing a physical delete request outside the API", async () => {
    apiMock.mockResolvedValue({ data: {} });
    await useProjectsApi(apiMock as typeof $fetch).archive("project-id");
    expect(apiMock).toHaveBeenLastCalledWith("/projects/project-id", {
      method: "DELETE",
    });
  });
});
