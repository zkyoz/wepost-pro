import { describe, expect, it, vi } from "vitest";

describe("useTranslationsApi", () => {
  it("uses versioned translation endpoints without mutating source text", async () => {
    const api = vi.fn().mockResolvedValue({ data: [] });
    const translations = useTranslationsApi(api as typeof $fetch);
    await translations.list("publication-id");
    await translations.generate("publication-id", {
      sourceLocale: "fr",
      targetLocale: "en",
      sourceVersion: 2,
    });
    await translations.update("publication-id", "en", {
      sourceLocale: "fr",
      sourceVersion: 2,
      text: "Reviewed translation.",
    });
    await translations.approve("publication-id", "en", 2);

    expect(api).toHaveBeenNthCalledWith(
      1,
      "/publications/publication-id/translations",
    );
    expect(api).toHaveBeenNthCalledWith(
      2,
      "/publications/publication-id/translations/generate",
      {
        method: "POST",
        body: {
          sourceLocale: "fr",
          targetLocale: "en",
          sourceVersion: 2,
        },
      },
    );
    expect(api).toHaveBeenNthCalledWith(
      3,
      "/publications/publication-id/translations/en",
      {
        method: "PUT",
        body: {
          sourceLocale: "fr",
          sourceVersion: 2,
          text: "Reviewed translation.",
        },
      },
    );
    expect(api).toHaveBeenNthCalledWith(
      4,
      "/publications/publication-id/translations/en/approve",
      { method: "POST", body: { sourceVersion: 2 } },
    );
  });
});
