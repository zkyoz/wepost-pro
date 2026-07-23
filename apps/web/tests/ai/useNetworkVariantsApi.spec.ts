import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useNetworkVariantsApi", () => {
  beforeEach(() => apiMock.mockReset().mockResolvedValue({ data: [] }));

  it("uses readable endpoints and protects every mutation with CSRF", async () => {
    const api = useNetworkVariantsApi(apiMock as typeof $fetch);
    await api.list("publication-id");
    await api.effective("publication-id", "linkedin");
    await api.create("publication-id", "linkedin", "Texte");
    await api.generate("publication-id", {
      networks: ["linkedin"],
      tone: "professional",
      length: "medium",
      language: "fr",
    });
    await api.update("variant-id", "Texte relu");
    await api.approve("variant-id");
    await api.markStale("variant-id");

    expect(apiMock).toHaveBeenCalledWith(
      "/publications/publication-id/network-variants/linkedin/effective",
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/publications/publication-id/network-variants",
      { method: "POST", body: { network: "linkedin", text: "Texte" } },
    );
    expect(
      apiMock.mock.calls.filter(([url]) => url === "/auth/csrf"),
    ).toHaveLength(5);
  });
});
