<script setup lang="ts">
const props = defineProps<{
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
}>();
const emit = defineEmits<{ confirm: [] }>();
const dialog = ref<HTMLDialogElement>();
const cancelButton = ref<HTMLButtonElement>();
let trigger: HTMLElement | null = null;

async function open() {
  trigger = document.activeElement as HTMLElement | null;
  dialog.value?.showModal();
  await nextTick();
  cancelButton.value?.focus();
}

function close() {
  dialog.value?.close();
}

function confirm() {
  emit("confirm");
  close();
}

function restoreFocus() {
  trigger?.focus();
}

defineExpose({ open });
</script>

<template>
  <dialog ref="dialog" class="confirm-dialog" @close="restoreFocus">
    <h2>{{ props.title }}</h2>
    <p>{{ props.message }}</p>
    <div class="dialog-actions">
      <button ref="cancelButton" type="button" @click="close">Annuler</button>
      <button
        type="button"
        :class="{ 'button-danger': props.danger }"
        @click="confirm"
      >
        {{ props.confirmLabel }}
      </button>
    </div>
  </dialog>
</template>
