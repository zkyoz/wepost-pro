import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
const rawFetchMock = vi.fn();

describe("useMediaApi", () => {
  beforeEach(() => {
    apiMock.mockReset();
    rawFetchMock.mockReset().mockResolvedValue({ ok: true });
  });

  it("computes the expected SHA-256 checksum", async () => {
    const blob = new Blob(["wepost"], { type: "text/plain" });
    expect(await mediaChecksum(blob)).toBe(
      "0acf6bc14db50f48b20aac62b740005dab62b22154a70a2a8f6cd7648a449960",
    );
  });

  it("initializes, transfers, validates and associates a signed upload", async () => {
    const file = new File(["wepost"], "visuel.png", { type: "image/png" });
    apiMock
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        data: { id: "media-id" },
        upload: {
          url: "https://storage.example.test/signed",
          method: "PUT",
          headers: { "Content-Type": "image/png" },
        },
      })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ data: { id: "media-id" } })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ data: { id: "media-id" } });
    const progress: number[] = [];

    await useMediaApi(
      apiMock as typeof $fetch,
      rawFetchMock as typeof fetch,
    ).upload(
      "publication-id",
      file,
      { altText: "Une campagne", isDecorative: false },
      (value) => progress.push(value),
    );

    expect(apiMock).toHaveBeenCalledWith(
      "/publications/publication-id/media/uploads",
      expect.objectContaining({
        method: "POST",
        body: expect.objectContaining({
          originalName: "visuel.png",
          declaredMimeType: "image/png",
          altText: "Une campagne",
        }),
      }),
    );
    expect(rawFetchMock).toHaveBeenCalledWith(
      "https://storage.example.test/signed",
      expect.objectContaining({ method: "PUT", body: file }),
    );
    expect(apiMock).toHaveBeenCalledWith("/media/media-id/finalize", {
      method: "POST",
    });
    expect(apiMock).toHaveBeenCalledWith("/publications/publication-id/media", {
      method: "POST",
      body: { mediaId: "media-id" },
    });
    expect(progress).toEqual([10, 35, 75, 100]);
  });

  it("uses explicit update, ordering and logical deletion endpoints", async () => {
    apiMock.mockResolvedValue(undefined);
    const api = useMediaApi(
      apiMock as typeof $fetch,
      rawFetchMock as typeof fetch,
    );
    await api.update("media-id", { altText: null, isDecorative: true });
    await api.reorder("publication-id", ["second", "first"]);
    await api.remove("media-id");

    expect(apiMock).toHaveBeenCalledWith("/media/media-id", {
      method: "PATCH",
      body: { altText: null, isDecorative: true },
    });
    expect(apiMock).toHaveBeenCalledWith(
      "/publications/publication-id/media/order",
      { method: "PATCH", body: { mediaIds: ["second", "first"] } },
    );
    expect(apiMock).toHaveBeenCalledWith("/media/media-id", {
      method: "DELETE",
    });
  });
});
