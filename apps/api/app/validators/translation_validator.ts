import { APP_LOCALES } from '#domain/i18n/locale'
import vine from '@vinejs/vine'

const id = vine.string().uuid()
const locale = vine.enum(APP_LOCALES)

export const updateLocaleValidator = vine.compile(vine.object({ locale }))

export const publicationTranslationsValidator = vine.compile(
  vine.object({ params: vine.object({ id }) })
)

export const createTranslationValidator = vine.compile(
  vine.object({
    params: vine.object({ id }),
    sourceLocale: locale,
    targetLocale: locale,
    sourceVersion: vine.number().min(1),
  })
)

export const updateTranslationValidator = vine.compile(
  vine.object({
    params: vine.object({ id, locale }),
    sourceLocale: locale,
    sourceVersion: vine.number().min(1),
    text: vine.string().trim().minLength(1).maxLength(10_000),
  })
)

export const approveTranslationValidator = vine.compile(
  vine.object({
    params: vine.object({ id, locale }),
    sourceVersion: vine.number().min(1),
  })
)
