<script setup lang="ts">
const props = defineProps<{
  title: string;
  details: Record<string, unknown> | null;
}>();
const dialog = ref<HTMLDialogElement>();
const titleId = useId();
const titleElement = ref<HTMLHeadingElement>();
let trigger: HTMLElement | null = null;

const entries = computed(() => Object.entries(props.details ?? {}));

function display(value: unknown) {
  if (value === null || value === undefined || value === "")
    return "Non renseigné";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (Array.isArray(value)) return value.join(", ") || "Aucun";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

async function open() {
  trigger = document.activeElement as HTMLElement | null;
  dialog.value?.showModal();
  await nextTick();
  titleElement.value?.focus({ preventScroll: true });
  if (dialog.value) dialog.value.scrollTop = 0;
}

function close() {
  dialog.value?.close();
}

function restoreFocus() {
  trigger?.focus();
}

defineExpose({ open });
</script>

<template>
  <dialog
    ref="dialog"
    class="confirm-dialog admin-details-dialog"
    :aria-labelledby="titleId"
    @close="restoreFocus"
  >
    <h2 :id="titleId" ref="titleElement" tabindex="-1">{{ props.title }}</h2>
    <dl class="admin-details-list">
      <div v-for="[key, value] in entries" :key="key">
        <dt>{{ key }}</dt>
        <dd>{{ display(value) }}</dd>
      </div>
    </dl>
    <div class="dialog-actions">
      <button type="button" @click="close">Fermer</button>
    </div>
  </dialog>
</template>
