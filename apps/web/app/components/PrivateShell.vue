<script setup lang="ts">
const { user, logout, isLoading } = useAuth();
const { t } = useLocale();
const route = useRoute();
const mobileOpen = ref(false);
const initials = computed(() =>
  (user.value?.displayName ?? "W")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join(""),
);
const sectionTitle = computed(() => {
  const path = route.path;
  if (path.startsWith("/settings/")) return t("navigation.networksGroup");
  if (path.startsWith("/publications/")) return "Publications";
  const sections = [
    "projects",
    "calendar",
    "notifications",
    "supervision",
    "statistics",
  ];
  const section = sections.find((name) => path.startsWith(`/${name}`));
  return section
    ? t(`navigation.${section}`)
    : t(
        path.startsWith("/admin")
          ? "navigation.administration"
          : "navigation.dashboard",
      );
});
watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false;
  },
);
async function signOut() {
  await logout();
  await navigateTo("/auth/login");
}
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="app-sidebar__brand">
        <AppBrand /><span class="workspace-caption">{{
          t("navigation.workspaceGroup")
        }}</span>
      </div>
      <AppNavigation v-if="user" :role="user.role" />
      <div class="app-sidebar__footer">
        <div v-if="user" class="app-user">
          <span class="app-user__avatar" aria-hidden="true">{{
            initials
          }}</span>
          <span class="app-user__identity"
            ><strong>{{ user.displayName }}</strong
            ><small>{{ t(`roles.${user.role}`) }}</small></span
          >
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          class="sidebar-logout"
          icon="i-lucide-log-out"
          :loading="isLoading"
          @click="signOut"
          >{{ t("shell.logout") }}</UButton
        >
      </div>
    </aside>
    <div class="app-main">
      <header class="app-header">
        <USlideover
          v-model:open="mobileOpen"
          side="left"
          :title="t('navigation.label')"
          :description="t('navigation.workspaceGroup')"
          :ui="{ content: 'mobile-navigation-panel' }"
        >
          <UButton
            class="mobile-nav-trigger"
            color="neutral"
            variant="ghost"
            icon="i-lucide-menu"
            :aria-label="t('navigation.label')"
          />
          <template #body
            ><AppBrand /><AppNavigation v-if="user" :role="user.role" /><UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-log-out"
              :loading="isLoading"
              @click="signOut"
              >{{ t("shell.logout") }}</UButton
            ></template
          >
        </USlideover>
        <span class="app-header__context">{{ sectionTitle }}</span>
        <div class="app-header__tools">
          <ThemeToggle />
          <ClientOnly
            ><LocaleSwitcher /><template #fallback
              ><span class="locale-switcher" aria-hidden="true" /></template
          ></ClientOnly>
          <UButton
            to="/notifications"
            color="neutral"
            variant="ghost"
            icon="i-lucide-bell"
            :aria-label="t('navigation.notifications')"
          />
        </div>
      </header>
      <slot />
      <footer class="workspace-footer">
        <span>WePost Pro</span><span>{{ t("navigation.workspaceGroup") }}</span>
      </footer>
    </div>
  </div>
</template>
