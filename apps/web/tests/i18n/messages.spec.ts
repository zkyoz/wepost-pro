import { beforeEach, describe, expect, it } from "vitest";
import { messageKeys, messages } from "~/i18n/messages";

describe("structured i18n messages", () => {
  beforeEach(() => clearNuxtState());

  it("keeps FR and EN keys complete and non-empty for CI", () => {
    expect(messageKeys(messages.en)).toEqual(messageKeys(messages.fr));
    for (const localeMessages of Object.values(messages)) {
      for (const key of messageKeys(localeMessages)) {
        const value = key
          .split(".")
          .reduce<unknown>(
            (current, part) =>
              (current as Record<string, unknown> | undefined)?.[part],
            localeMessages,
          );
        expect(String(value).trim(), key).not.toBe("");
      }
    }
  });

  it("switches locale, falls back to French and records missing keys", () => {
    const i18n = useLocale();
    expect(i18n.t("login.heading")).toBe("Se connecter");
    i18n.setLocale("en");
    expect(i18n.t("login.heading")).toBe("Sign in");
    expect(i18n.t("unknown.key")).toBe("unknown.key");
    expect(i18n.missingKeys.value).toContain("unknown.key");
  });

  it("formats dates and numbers with the selected locale", () => {
    const i18n = useLocale();
    expect(i18n.formatNumber(1234.5)).toMatch(/1.?234,5/);
    i18n.setLocale("en");
    expect(i18n.formatNumber(1234.5)).toMatch(/1,234\.5/);
    expect(
      i18n.formatDateTime("2026-07-23T10:00:00.000Z", {
        timeZone: "UTC",
        year: "numeric",
      }),
    ).toContain("2026");
  });
});
