<script setup lang="ts">
import type { ApiValidationError } from "~/types/auth";
import type { Project, ProjectClient, ProjectInput } from "~/types/project";

const props = defineProps<{
  clients: ProjectClient[];
  project?: Project;
  errors?: ApiValidationError[];
  submitting?: boolean;
}>();
const emit = defineEmits<{ submit: [input: ProjectInput] }>();

const defaultTimezone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const form = reactive<ProjectInput>({
  name: props.project?.name ?? "",
  description: props.project?.description ?? "",
  clientUserId: props.project?.clientUserId ?? props.clients[0]?.id ?? "",
  memberUserIds:
    props.project?.members
      .filter((member) => member.id !== props.project?.clientUserId)
      .map((member) => member.id) ?? [],
  timezone: props.project?.timezone ?? defaultTimezone,
});
const errorSummary = ref<HTMLElement>();

const fieldErrors = computed(() =>
  Object.fromEntries(
    (props.errors ?? [])
      .filter((error) => error.field)
      .map((error) => [error.field, error.message]),
  ),
);
const additionalClients = computed(() =>
  props.clients.filter((client) => client.id !== form.clientUserId),
);

watch(
  () => props.errors,
  async (errors) => {
    if (!errors?.length) return;
    await nextTick();
    errorSummary.value?.focus();
  },
);

function submit() {
  emit("submit", {
    ...form,
    memberUserIds: form.memberUserIds.filter((id) => id !== form.clientUserId),
  });
}
</script>

<template>
  <form class="project-form" @submit.prevent="submit">
    <div
      v-if="errors?.length"
      ref="errorSummary"
      class="error-summary"
      role="alert"
      tabindex="-1"
    >
      <h2>Le formulaire contient des erreurs</h2>
      <ul>
        <li v-for="error in errors" :key="`${error.field}-${error.message}`">
          {{ error.message }}
        </li>
      </ul>
    </div>

    <div class="form-field">
      <label for="project-name"
        >Nom du projet <span aria-hidden="true">*</span></label
      >
      <input
        id="project-name"
        v-model="form.name"
        name="name"
        required
        minlength="2"
        maxlength="120"
        :aria-invalid="Boolean(fieldErrors.name)"
      />
    </div>

    <div class="form-field">
      <label for="project-description">Description</label>
      <textarea
        id="project-description"
        v-model="form.description"
        name="description"
        maxlength="5000"
        rows="6"
      />
    </div>

    <div class="form-field">
      <label for="project-client"
        >Client principal <span aria-hidden="true">*</span></label
      >
      <select
        id="project-client"
        v-model="form.clientUserId"
        name="clientUserId"
        required
        :aria-invalid="Boolean(fieldErrors.clientUserId)"
      >
        <option value="" disabled>Sélectionner un client</option>
        <option v-for="client in clients" :key="client.id" :value="client.id">
          {{ client.displayName }} — {{ client.email }}
        </option>
      </select>
    </div>

    <fieldset v-if="additionalClients.length" class="project-members">
      <legend>Membres clients supplémentaires</legend>
      <label v-for="client in additionalClients" :key="client.id">
        <input
          v-model="form.memberUserIds"
          type="checkbox"
          :value="client.id"
        />
        {{ client.displayName }}
      </label>
    </fieldset>

    <div class="form-field">
      <label for="project-timezone"
        >Fuseau horaire <span aria-hidden="true">*</span></label
      >
      <input
        id="project-timezone"
        v-model="form.timezone"
        name="timezone"
        required
        maxlength="80"
        aria-describedby="timezone-hint"
        :aria-invalid="Boolean(fieldErrors.timezone)"
      />
      <p id="timezone-hint" class="form-field__hint">
        Format IANA, par exemple Europe/Paris.
      </p>
    </div>

    <button
      class="button-primary"
      type="submit"
      :disabled="submitting || !clients.length"
    >
      {{
        submitting
          ? "Enregistrement…"
          : project
            ? "Enregistrer"
            : "Créer le projet"
      }}
    </button>
  </form>
</template>
