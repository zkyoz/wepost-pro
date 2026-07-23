import { createHash } from 'node:crypto'

export const APP_LOCALES = ['fr', 'en'] as const
export type AppLocale = (typeof APP_LOCALES)[number]
export const DEFAULT_LOCALE: AppLocale = 'fr'

export function isAppLocale(value: string): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale)
}

export function translationSourceHash(text: string) {
  return createHash('sha256').update(text.normalize('NFC')).digest('hex')
}

export function isTranslationStale(
  storedVersion: number,
  storedHash: string,
  sourceVersion: number,
  sourceText: string
) {
  return storedVersion !== sourceVersion || storedHash !== translationSourceHash(sourceText)
}
