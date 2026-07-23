import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
const input = {
  title: "Publication test",
  baseText: "Un texte accessible.",
  targetNetworks: ["linkedin" as const],
  scheduledAt: null,
  timezone: "Europe/Paris",
};

describe("usePublicationsApi", () => {
  beforeEach(() =>
    apiMock.mockReset().mockResolvedValue({ data: {}, meta: {} }),
  );

  it("sends project, status and network filters", async () => {
    await usePublicationsApi(apiMock as typeof $fetch).list("project-id", {
      page: 2,
      q: "campagne",
      status: "draft",
      network: "linkedin",
    });
    expect(apiMock).toHaveBeenCalledWith("/projects/project-id/publications", {
      query: { page: 2, q: "campagne", status: "draft", network: "linkedin" },
    });
  });

  it("gets CSRF protection and carries the optimistic version on update", async () => {
    await usePublicationsApi(apiMock as typeof $fetch).update(
      "publication-id",
      4,
      input,
    );
    expect(apiMock).toHaveBeenNthCalledWith(1, "/auth/csrf");
    expect(apiMock).toHaveBeenNthCalledWith(2, "/publications/publication-id", {
      method: "PATCH",
      body: { ...input, contentVersion: 4 },
    });
  });

  it("uses explicit endpoints for duplication, transition and logical archive", async () => {
    const api = usePublicationsApi(apiMock as typeof $fetch);
    await api.duplicate("publication-id");
    await api.transition("publication-id", 2, "in_progress");
    await api.archive("publication-id");
    expect(apiMock).toHaveBeenCalledWith(
      "/publications/publication-id/duplicate",
      { method: "POST" },
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/publications/publication-id/transition",
      {
        method: "POST",
        body: { contentVersion: 2, status: "in_progress" },
      },
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/publications/publication-id/archive",
      { method: "POST" },
    );
  });
});
