<script setup lang="ts">
definePageMeta({ middleware: "auth" });
const { t } = useLocale();
useHead(() => ({ title: t("accessDenied.title") }));
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <p class="auth-form__eyebrow">{{ t("accessDenied.eyebrow") }}</p>
      <h1>{{ t("accessDenied.heading") }}</h1>
      <p class="dashboard__lead" role="status">
        {{ t("accessDenied.explanation") }}
      </p>
      <NuxtLink class="button-link" to="/dashboard">{{
        t("accessDenied.back")
      }}</NuxtLink>
    </main>
  </PrivateShell>
</template>
