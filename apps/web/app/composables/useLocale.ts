import { APP_LOCALES, messages, type AppLocale } from "~/i18n/messages";

type MessageParameters = Record<string, string | number>;

function messageAt(locale: AppLocale, key: string): string | undefined {
  let value: unknown = messages[locale];
  for (const part of key.split(".")) {
    if (!value || typeof value !== "object" || !(part in value))
      return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : undefined;
}

export function useLocale() {
  const locale = useState<AppLocale>("i18n.locale", () => "fr");
  const missingKeys = useState<string[]>("i18n.missingKeys", () => []);

  function setLocale(nextLocale: AppLocale) {
    if (APP_LOCALES.includes(nextLocale)) locale.value = nextLocale;
  }

  function t(key: string, parameters: MessageParameters = {}) {
    const activeLocale = APP_LOCALES.includes(locale.value)
      ? locale.value
      : "fr";
    const translated = messageAt(activeLocale, key);
    const fallback = translated ?? messageAt("fr", key);
    const recordedKeys = missingKeys.value ?? [];
    if (!translated && !recordedKeys.includes(key))
      missingKeys.value = [...recordedKeys, key];
    return (fallback ?? key).replace(/\{(\w+)\}/g, (_, name: string) =>
      String(parameters[name] ?? `{${name}}`),
    );
  }

  function formatDateTime(
    value: string | Date,
    options: Intl.DateTimeFormatOptions = {},
  ) {
    return new Intl.DateTimeFormat(
      locale.value === "fr" ? "fr-FR" : "en-GB",
      options,
    ).format(new Date(value));
  }

  function formatNumber(value: number, options: Intl.NumberFormatOptions = {}) {
    return new Intl.NumberFormat(
      locale.value === "fr" ? "fr-FR" : "en-GB",
      options,
    ).format(value);
  }

  return {
    locale,
    missingKeys,
    missingKeyCount: computed(() => missingKeys.value?.length ?? 0),
    setLocale,
    t,
    formatDateTime,
    formatNumber,
  };
}
