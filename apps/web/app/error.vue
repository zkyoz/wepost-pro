<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();
const { theme } = useAppTheme();
const { locale } = useLocale();
const missing = computed(() => props.error.statusCode === 404);
const title = computed(() =>
  locale.value === "en"
    ? missing.value
      ? "Page not found"
      : "Something went wrong"
    : missing.value
      ? "Page introuvable"
      : "Une erreur est survenue",
);
useHead(() => ({
  title: title.value,
  htmlAttrs: { lang: locale.value, class: theme.value },
}));
</script>

<template>
  <div class="error-page">
    <a class="skip-link" href="#main-content">{{
      locale === "en" ? "Skip to main content" : "Aller au contenu principal"
    }}</a>
    <header class="error-page__header">
      <a class="brand" href="/" aria-label="Wepost.pro, accueil"
        >wepost<span>.pro</span></a
      >
      <ThemeToggle />
    </header>
    <main id="main-content" class="error-page__content" tabindex="-1">
      <p class="error-page__code">{{ error.statusCode }}</p>
      <h1>{{ title }}</h1>
      <p v-if="missing">
        {{
          locale === "en"
            ? "This page does not exist or is no longer available."
            : "Cette page n’existe pas ou n’est plus disponible."
        }}
      </p>
      <p v-else>
        {{
          locale === "en"
            ? "Please try again later or return to the home page."
            : "Réessayez dans quelques instants ou revenez à l’accueil."
        }}
      </p>
      <button
        class="button-primary"
        type="button"
        @click="clearError({ redirect: '/' })"
      >
        {{ locale === "en" ? "Back to home" : "Revenir à l’accueil" }}
      </button>
    </main>
  </div>
</template>
