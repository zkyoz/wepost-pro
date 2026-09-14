<script setup lang="ts">
const props = defineProps<{ name: string; size?: number }>();
const icons: Record<string, string> = {
  home: "lucide:house",
  folder: "lucide:folder",
  calendar: "lucide:calendar-days",
  bell: "lucide:bell",
  shield: "lucide:activity",
  chart: "lucide:chart-no-axes-column-increasing",
  admin: "lucide:users",
  logout: "lucide:log-out",
  plus: "lucide:plus",
  arrow: "lucide:arrow-right",
  message: "lucide:message-square",
  check: "lucide:circle-check",
  alert: "lucide:triangle-alert",
  facebook: "simple-icons:facebook",
  instagram: "simple-icons:instagram",
  linkedin: "simple-icons:linkedin",
  pinterest: "simple-icons:pinterest",
  tiktok: "simple-icons:tiktok",
  image: "lucide:image",
  clock: "lucide:clock",
  send: "lucide:send",
  history: "lucide:history",
};
const icon = computed(() => icons[props.name] ?? "lucide:triangle-alert");
</script>

<template>
  <UIcon
    :name="icon"
    class="app-icon"
    :style="{ width: `${size ?? 20}px`, height: `${size ?? 20}px` }"
    aria-hidden="true"
  />
</template>
