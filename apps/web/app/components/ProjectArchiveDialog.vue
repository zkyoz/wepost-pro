<script setup lang="ts">
const props = defineProps<{ projectName: string }>();
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

function restoreFocus() {
  trigger?.focus();
}

function confirm() {
  emit("confirm");
  close();
}

defineExpose({ open });
</script>

<template>
  <dialog ref="dialog" class="confirm-dialog" @close="restoreFocus">
    <h2>Archiver « {{ props.projectName }} » ?</h2>
    <p>
      Le projet restera consultable mais n’acceptera plus de nouvelles
      publications.
    </p>
    <div class="dialog-actions">
      <button ref="cancelButton" type="button" @click="close">Annuler</button>
      <button class="button-danger" type="button" @click="confirm">
        Archiver
      </button>
    </div>
  </dialog>
</template>
