import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

describe("useAnnotationsApi", () => {
  beforeEach(() => apiMock.mockReset().mockResolvedValue({ data: [] }));

  it("lists by media and protects create, update and delete with CSRF", async () => {
    const api = useAnnotationsApi(apiMock as typeof $fetch);
    const payload = {
      shape: "point" as const,
      x: 0.5,
      y: 0.4,
      width: null,
      height: null,
      body: "Décaler le logo",
    };
    await api.list("publication-id", "media-id", 2);
    await api.create("publication-id", "media-id", payload);
    await api.update("annotation-id", payload);
    await api.remove("annotation-id");

    expect(apiMock).toHaveBeenCalledWith(
      "/publications/publication-id/media/media-id/annotations",
      { query: { version: 2 } },
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/publications/publication-id/media/media-id/annotations",
      { method: "POST", body: payload },
    );
    expect(apiMock).toHaveBeenCalledWith("/annotations/annotation-id", {
      method: "PATCH",
      body: payload,
    });
    expect(apiMock).toHaveBeenCalledWith("/annotations/annotation-id", {
      method: "DELETE",
    });
    expect(
      apiMock.mock.calls.filter(([url]) => url === "/auth/csrf"),
    ).toHaveLength(3);
  });
});
