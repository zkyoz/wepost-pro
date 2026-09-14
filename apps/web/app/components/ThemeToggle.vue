<script setup lang="ts">
const { theme, toggleTheme } = useAppTheme();
const { locale } = useLocale();
const label = computed(() =>
  locale.value === "en"
    ? `Switch to ${theme.value === "dark" ? "light" : "dark"} theme`
    : `Passer au thème ${theme.value === "dark" ? "clair" : "sombre"}`,
);
</script>

<template>
  <UButton
    class="theme-toggle"
    color="neutral"
    variant="ghost"
    :aria-label="label"
    :title="label"
    :icon="theme === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
    @click="toggleTheme"
  />
</template>
