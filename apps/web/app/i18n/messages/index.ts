import en from "./en";
import fr from "./fr";

export const messages = { fr, en } as const;
export type AppLocale = keyof typeof messages;
export const APP_LOCALES = Object.keys(messages) as AppLocale[];

export function messageKeys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "object" && child !== null
      ? messageKeys(child, path)
      : [path];
  });
}
