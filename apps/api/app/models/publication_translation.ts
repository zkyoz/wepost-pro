import { PublicationTranslationSchema } from '#database/schema'
import type { AppLocale } from '#domain/i18n/locale'

export type PublicationTranslationStatus = 'draft' | 'approved' | 'stale'

export default class PublicationTranslation extends PublicationTranslationSchema {
  declare sourceLocale: AppLocale
  declare targetLocale: AppLocale
  declare status: PublicationTranslationStatus
}
