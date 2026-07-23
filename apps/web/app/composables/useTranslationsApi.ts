import type { AppLocale } from "~/types/auth";
import type {
  PublicationTranslation,
  TranslationList,
} from "~/types/translation";

export function useTranslationsApi(apiOverride?: typeof $fetch) {
  const $api = apiOverride ?? useNuxtApp().$api;

  return {
    list(publicationId: string) {
      return $api<TranslationList>(
        `/publications/${publicationId}/translations`,
      );
    },
    generate(
      publicationId: string,
      payload: {
        sourceLocale: AppLocale;
        targetLocale: AppLocale;
        sourceVersion: number;
      },
    ) {
      return $api<{ data: PublicationTranslation }>(
        `/publications/${publicationId}/translations/generate`,
        { method: "POST", body: payload },
      );
    },
    update(
      publicationId: string,
      targetLocale: AppLocale,
      payload: {
        sourceLocale: AppLocale;
        sourceVersion: number;
        text: string;
      },
    ) {
      return $api<{ data: PublicationTranslation }>(
        `/publications/${publicationId}/translations/${targetLocale}`,
        { method: "PUT", body: payload },
      );
    },
    approve(
      publicationId: string,
      targetLocale: AppLocale,
      sourceVersion: number,
    ) {
      return $api<{ data: PublicationTranslation }>(
        `/publications/${publicationId}/translations/${targetLocale}/approve`,
        { method: "POST", body: { sourceVersion } },
      );
    },
  };
}
