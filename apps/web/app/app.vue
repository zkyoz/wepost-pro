<script setup lang="ts">
const { locale, t } = useLocale();
useHead(() => ({ htmlAttrs: { lang: locale.value } }));
</script>

<template>
  <a class="skip-link" href="#main-content">{{ t("common.skipLink") }}</a>
  <NuxtRouteAnnouncer />
  <NuxtPage />
</template>
