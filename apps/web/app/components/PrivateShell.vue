<script setup lang="ts">
const { user, logout, isLoading } = useAuth();
const { t } = useLocale();
const initials = computed(() =>
  (user.value?.displayName ?? "W")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join(""),
);

async function signOut() {
  await logout();
  await navigateTo("/auth/login");
}
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <AppBrand />
      <AppNavigation v-if="user" :role="user.role" />
    </aside>
    <div class="app-main">
      <header class="app-header">
        <ClientOnly>
          <LocaleSwitcher />
          <template #fallback>
            <span class="locale-switcher" aria-hidden="true"></span>
          </template>
        </ClientOnly>
        <div v-if="user" class="app-user">
          <span class="app-user__avatar" aria-hidden="true">{{
            initials
          }}</span>
          <span class="app-user__identity">
            <strong>{{ user.displayName }}</strong>
            <small>{{ t(`roles.${user.role}`) }}</small>
          </span>
        </div>
        <button
          class="button-secondary"
          type="button"
          :disabled="isLoading"
          @click="signOut"
        >
          <AppIcon name="logout" :size="19" />
          {{ isLoading ? t("shell.loggingOut") : t("shell.logout") }}
        </button>
      </header>
      <slot />
    </div>
  </div>
</template>
