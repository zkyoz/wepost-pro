<script setup lang="ts">
import type { ApiValidationError } from "~/types/auth";
import {
  SOCIAL_NETWORKS,
  type Publication,
  type PublicationInput,
  type SocialNetwork,
} from "~/types/publication";

const props = defineProps<{
  publication?: Publication;
  defaultTimezone?: string;
  errors?: ApiValidationError[];
  submitting?: boolean;
}>();
const emit = defineEmits<{ submit: [input: PublicationInput] }>();
const networkLabels: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  tiktok: "TikTok",
};

const form = reactive<PublicationInput>({
  title: props.publication?.title ?? "",
  baseText: props.publication?.baseText ?? "",
  targetNetworks: props.publication?.targetNetworks ?? [],
  scheduledAt: props.publication?.scheduledAt
    ? props.publication.scheduledAt.slice(0, 16)
    : null,
  timezone:
    props.publication?.timezone ??
    props.defaultTimezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone ??
    "UTC",
});
const initial = JSON.stringify(form);
const dirty = computed(() => JSON.stringify(form) !== initial);
const errorSummary = ref<HTMLElement>();
const fieldErrors = computed(() =>
  Object.fromEntries(
    (props.errors ?? [])
      .filter((error) => error.field)
      .map((error) => [error.field, error.message]),
  ),
);

watch(
  () => props.errors,
  async (errors) => {
    if (!errors?.length) return;
    await nextTick();
    errorSummary.value?.focus();
  },
);
</script>

<template>
  <form class="publication-form" @submit.prevent="emit('submit', { ...form })">
    <p class="unsaved-indicator" role="status" aria-live="polite">
      {{
        dirty
          ? "Modifications non enregistrées"
          : "Toutes les modifications sont enregistrées"
      }}
    </p>
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

    <section class="form-section" aria-labelledby="compose-content-title">
      <h2 id="compose-content-title">Votre contenu</h2>
      <div class="form-field">
        <label for="publication-title"
          >Titre interne <span aria-hidden="true">*</span></label
        >
        <UInput
          id="publication-title"
          v-model="form.title"
          class="w-full"
          size="lg"
          name="title"
          required
          minlength="2"
          maxlength="120"
          :aria-invalid="Boolean(fieldErrors.title)"
        />
      </div>

      <div class="form-field">
        <label for="publication-text"
          >Texte <span aria-hidden="true">*</span></label
        >
        <UTextarea
          id="publication-text"
          v-model="form.baseText"
          class="w-full"
          size="lg"
          autoresize
          name="baseText"
          required
          maxlength="10000"
          :rows="8"
          aria-describedby="publication-character-count"
          :aria-invalid="Boolean(fieldErrors.baseText)"
        />
        <p
          id="publication-character-count"
          class="form-field__hint"
          role="status"
          aria-live="polite"
        >
          {{ form.baseText.length }} caractères sur 10 000.
        </p>
      </div>
    </section>
    <fieldset class="network-options">
      <legend>Réseaux ciblés <span aria-hidden="true">*</span></legend>
      <label v-for="network in SOCIAL_NETWORKS" :key="network">
        <input v-model="form.targetNetworks" type="checkbox" :value="network" />
        <AppIcon :name="network" :size="16" />
        {{ networkLabels[network] }}
      </label>
    </fieldset>

    <section class="form-section" aria-labelledby="compose-schedule-title">
      <h2 id="compose-schedule-title">Planification</h2>
      <p class="form-field__hint">
        Définissez la date souhaitée. La publication sur les réseaux sera
        confirmée après validation du contenu.
      </p>
      <div class="form-grid">
        <div class="form-field">
          <label for="publication-date">Date et heure souhaitées</label>
          <input
            id="publication-date"
            v-model="form.scheduledAt"
            name="scheduledAt"
            type="datetime-local"
          />
        </div>
        <div class="form-field">
          <label for="publication-timezone"
            >Fuseau horaire <span aria-hidden="true">*</span></label
          >
          <input
            id="publication-timezone"
            v-model="form.timezone"
            name="timezone"
            required
            maxlength="80"
            aria-describedby="publication-timezone-hint"
          />
          <p id="publication-timezone-hint" class="form-field__hint">
            Format IANA, par exemple Europe/Paris.
          </p>
        </div>
      </div>
    </section>
    <UButton
      icon="i-lucide-circle-check"
      class="button-primary"
      type="submit"
      :disabled="submitting || form.targetNetworks.length === 0"
    >
      {{
        submitting
          ? "Enregistrement…"
          : publication
            ? "Enregistrer"
            : "Créer la publication"
      }}
    </UButton>
  </form>
</template>
