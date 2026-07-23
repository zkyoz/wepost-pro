<script setup lang="ts">
import { APP_LOCALES, type AppLocale } from "~/i18n/messages";

const { user, updateLocale, isLoading } = useAuth();
const { locale, setLocale, t } = useLocale();
const announcement = ref("");

async function persistLocale(nextLocale: AppLocale) {
  if (!APP_LOCALES.includes(nextLocale) || nextLocale === locale.value) return;

  setLocale(nextLocale);
  if (user.value) await updateLocale(nextLocale);
  announcement.value = t("common.languageChanged");
}

const selectedLocale = computed({
  get: () => locale.value,
  set: (nextLocale: AppLocale) => {
    void persistLocale(nextLocale);
  },
});
</script>

<template>
  <div class="locale-switcher">
    <label for="interface-locale">{{ t("common.language") }}</label>
    <select
      id="interface-locale"
      v-model="selectedLocale"
      :disabled="isLoading"
    >
      <option value="fr">{{ t("common.french") }}</option>
      <option value="en">{{ t("common.english") }}</option>
    </select>
    <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>
  </div>
</template>
