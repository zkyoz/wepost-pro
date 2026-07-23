<script setup lang="ts">
import {
  SUPERVISION_CATEGORIES,
  SUPERVISION_LABELS,
  type SupervisionCategory,
} from "~/types/supervision";

defineProps<{
  counts: Record<SupervisionCategory, number>;
  selected: SupervisionCategory;
  loading?: boolean;
}>();

defineEmits<{ select: [category: SupervisionCategory] }>();
</script>

<template>
  <ul
    class="supervision-summary"
    aria-label="Synthèse des publications et commentaires"
  >
    <li v-for="category in SUPERVISION_CATEGORIES" :key="category">
      <button
        type="button"
        :aria-pressed="selected === category"
        :disabled="loading"
        @click="$emit('select', category)"
      >
        <span>{{ SUPERVISION_LABELS[category] }}</span>
        <strong>{{ counts[category] }}</strong>
        <small>Afficher la liste</small>
      </button>
    </li>
  </ul>
</template>
