<script setup lang="ts">
import { en, fr } from "@nuxt/ui/locale";

const { locale, t } = useLocale();
const { theme } = useAppTheme();
useHead(() => ({ htmlAttrs: { lang: locale.value, class: theme.value } }));
</script>

<template>
  <UApp :locale="locale === 'en' ? en : fr">
    <a class="skip-link" href="#main-content">{{ t("common.skipLink") }}</a>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </UApp>
</template>
