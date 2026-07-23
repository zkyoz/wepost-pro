<script setup lang="ts">
defineProps<{
  name: string;
  size?: number;
}>();
</script>

<template>
  <svg
    class="app-icon"
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <template v-if="name === 'home'">
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-6h6v6" />
    </template>
    <template v-else-if="name === 'folder'">
      <path d="M3 6.5h6l2 2h10v10.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </template>
    <template v-else-if="name === 'calendar'">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" />
      <path d="M10 20h4" />
    </template>
    <template v-else-if="name === 'shield'">
      <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </template>
    <template v-else-if="name === 'chart'">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
    </template>
    <template v-else-if="name === 'facebook'">
      <circle cx="12" cy="12" r="9" />
      <path d="M13.5 8H12a2 2 0 0 0-2 2v9M8 13h7" />
    </template>
    <template v-else-if="name === 'instagram'">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'linkedin'">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 10v7M8 7.2v.1M12 17v-4a3 3 0 0 1 6 0v4M12 10v7" />
    </template>
    <template v-else-if="name === 'pinterest'">
      <circle cx="12" cy="12" r="9" />
      <path
        d="M9 18.5 11 9.8M10.2 15c.7.7 1.5 1 2.4 1 2.7 0 4.4-2.3 4.4-5.1A4.7 4.7 0 0 0 12 6a5.1 5.1 0 0 0-5 5.2c0 1.5.6 2.8 1.7 3.3"
      />
    </template>
    <template v-else-if="name === 'tiktok'">
      <path d="M14 4v10.5a4 4 0 1 1-3.2-3.9" />
      <path d="M14 4c.7 2.6 2.1 4 5 4" />
    </template>
    <template v-else-if="name === 'admin'">
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0M19 4v4M17 6h4" />
    </template>
    <template v-else-if="name === 'logout'">
      <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5M14 8l4 4-4 4M8 12h10" />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" />
    </template>
    <template v-else-if="name === 'arrow'">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </template>
    <template v-else-if="name === 'message'">
      <path
        d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
      />
    </template>
    <template v-else-if="name === 'check'">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.7 2.7L16.5 9" />
    </template>
    <template v-else>
      <path d="M12 8v5M12 17h.01" />
      <path
        d="M10.3 3.8 2.7 17a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
      />
    </template>
  </svg>
</template>
