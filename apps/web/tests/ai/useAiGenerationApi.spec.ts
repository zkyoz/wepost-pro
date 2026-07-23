import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useAiGenerationApi", () => {
  beforeEach(() => apiMock.mockReset().mockResolvedValue({ data: {} }));

  it("uses CSRF-protected create, apply and cancel endpoints", async () => {
    const api = useAiGenerationApi(apiMock as typeof $fetch);
    const input = {
      brief: "Présenter une nouvelle offre responsable.",
      tone: "professional" as const,
      length: "short" as const,
      language: "fr" as const,
      variantCount: 3,
    };
    await api.create("publication-id", input);
    await api.apply("generation-id", "variant-2", 4);
    await api.cancel("generation-id");

    expect(apiMock).toHaveBeenCalledWith(
      "/publications/publication-id/ai-generations",
      { method: "POST", body: input },
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/ai-generations/generation-id/apply",
      {
        method: "POST",
        body: { variantId: "variant-2", contentVersion: 4 },
      },
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/ai-generations/generation-id/cancel",
      {
        method: "POST",
      },
    );
    expect(
      apiMock.mock.calls.filter(([url]) => url === "/auth/csrf"),
    ).toHaveLength(3);
  });

  it("lists history and reads one generation", async () => {
    const api = useAiGenerationApi(apiMock as typeof $fetch);
    await api.list("publication-id");
    await api.get("generation-id");
    expect(apiMock).toHaveBeenNthCalledWith(
      1,
      "/publications/publication-id/ai-generations",
    );
    expect(apiMock).toHaveBeenNthCalledWith(2, "/ai-generations/generation-id");
  });
});
