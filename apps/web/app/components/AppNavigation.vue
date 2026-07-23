<script setup lang="ts">
import type { UserRole } from "~/types/auth";

const props = defineProps<{ role: UserRole }>();
const { t } = useLocale();

const items = computed(() =>
  [
    {
      label: t("navigation.dashboard"),
      to: "/dashboard",
      roles: ["admin", "agency", "client"],
      icon: "home",
      group: "workspace",
    },
    {
      label: t("navigation.projects"),
      to: "/projects",
      roles: ["admin", "agency", "client"],
      icon: "folder",
      group: "workspace",
    },
    {
      label: t("navigation.calendar"),
      to: "/calendar",
      roles: ["admin", "agency", "client"],
      icon: "calendar",
      group: "workspace",
    },
    {
      label: t("navigation.notifications"),
      to: "/notifications",
      roles: ["admin", "agency", "client"],
      icon: "bell",
      group: "workspace",
    },
    {
      label: t("navigation.supervision"),
      to: "/supervision",
      roles: ["admin", "agency"],
      icon: "shield",
      group: "workspace",
    },
    {
      label: t("navigation.statistics"),
      to: "/statistics",
      roles: ["admin", "agency"],
      icon: "chart",
      group: "workspace",
    },
    {
      label: "Facebook",
      to: "/settings/facebook",
      roles: ["admin", "agency"],
      icon: "facebook",
      group: "networks",
    },
    {
      label: "Instagram",
      to: "/settings/instagram",
      roles: ["admin", "agency"],
      icon: "instagram",
      group: "networks",
    },
    {
      label: "LinkedIn",
      to: "/settings/linkedin",
      roles: ["admin", "agency"],
      icon: "linkedin",
      group: "networks",
    },
    {
      label: "Pinterest",
      to: "/settings/pinterest",
      roles: ["admin", "agency"],
      icon: "pinterest",
      group: "networks",
    },
    {
      to: "/settings/tiktok",
      label: "TikTok",
      roles: ["admin", "agency"],
      icon: "tiktok",
      group: "networks",
    },
    {
      label: t("navigation.administration"),
      to: "/admin",
      roles: ["admin"],
      icon: "admin",
      group: "admin",
    },
  ].filter((item) => (item.roles as UserRole[]).includes(props.role)),
);

const workspaceItems = computed(() =>
  items.value.filter((item) => item.group === "workspace"),
);
const networkItems = computed(() =>
  items.value.filter((item) => item.group === "networks"),
);
const adminItems = computed(() =>
  items.value.filter((item) => item.group === "admin"),
);
</script>

<template>
  <div class="role-indicator" role="status">
    <AppIcon name="admin" :size="18" />
    <span>{{ t("common.role", { role: t(`roles.${role}`) }) }}</span>
  </div>
  <nav class="app-nav" :aria-label="t('navigation.label')">
    <div class="app-nav__group">
      <p class="app-nav__label">{{ t("navigation.workspaceGroup") }}</p>
      <NuxtLink v-for="item in workspaceItems" :key="item.to" :to="item.to">
        <AppIcon :name="item.icon" :size="20" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
    <div v-if="networkItems.length" class="app-nav__group">
      <p class="app-nav__label">{{ t("navigation.networksGroup") }}</p>
      <NuxtLink v-for="item in networkItems" :key="item.to" :to="item.to">
        <AppIcon :name="item.icon" :size="20" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
    <div v-if="adminItems.length" class="app-nav__group">
      <p class="app-nav__label">{{ t("navigation.adminGroup") }}</p>
      <NuxtLink v-for="item in adminItems" :key="item.to" :to="item.to">
        <AppIcon :name="item.icon" :size="20" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
