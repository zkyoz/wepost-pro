<script setup lang="ts">
import {
  AI_LANGUAGES,
  AI_LENGTHS,
  AI_TONES,
  type AiGeneration,
  type AiGenerationInput,
  type ApplyAiVariantResult,
} from "~/types/ai";

const props = defineProps<{
  publicationId: string;
  contentVersion: number;
}>();
const emit = defineEmits<{ applied: [result: ApplyAiVariantResult] }>();
const api = useAiGenerationApi();
const input = reactive<AiGenerationInput>({
  brief: "",
  tone: "professional",
  length: "short",
  language: "fr",
  variantCount: 3,
});
const generations = ref<AiGeneration[]>([]);
const active = ref<AiGeneration | null>(null);
const submitting = ref(false);
const applyingId = ref<string | null>(null);
const announcement = ref("");
const errorMessage = ref("");
const statusLabels: Record<AiGeneration["status"], string> = {
  queued: "En attente",
  processing: "Traitement en cours",
  completed: "Terminée",
  failed: "Échec",
  cancelled: "Annulée",
};

function errorText(error: unknown) {
  return (
    getApiErrors(error)[0]?.message ||
    (error instanceof Error ? error.message : "L’action IA a échoué.")
  );
}

async function loadHistory() {
  try {
    generations.value = (await api.list(props.publicationId)).data;
  } catch (error) {
    errorMessage.value = errorText(error);
  }
}

async function pollGeneration(id: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 2_000));
    const generation = (await api.get(id)).data;
    active.value = generation;
    const position = generations.value.findIndex((item) => item.id === id);
    if (position >= 0) generations.value[position] = generation;
    if (!["queued", "processing"].includes(generation.status)) {
      announcement.value =
        generation.status === "completed"
          ? `${generation.variants.length} propositions sont prêtes.`
          : "La génération n’a pas abouti.";
      return;
    }
  }
  announcement.value =
    "La génération continue en arrière-plan. Son statut reste consultable ici.";
}

async function generate() {
  if (submitting.value) return;
  submitting.value = true;
  errorMessage.value = "";
  announcement.value =
    "Génération en cours. Aucun texte ne sera appliqué automatiquement.";
  try {
    const generation = (await api.create(props.publicationId, { ...input }))
      .data;
    active.value = generation;
    generations.value.unshift(generation);
    announcement.value =
      generation.status === "completed"
        ? `${generation.variants.length} propositions sont prêtes.`
        : "La génération est placée dans la file de traitement.";
    if (["queued", "processing"].includes(generation.status)) {
      void pollGeneration(generation.id);
    }
  } catch (error) {
    errorMessage.value = errorText(error);
  } finally {
    submitting.value = false;
  }
}

async function applyVariant(generation: AiGeneration, variantId: string) {
  applyingId.value = variantId;
  errorMessage.value = "";
  try {
    const result = (
      await api.apply(generation.id, variantId, props.contentVersion)
    ).data;
    active.value = result.generation;
    Object.assign(generation, result.generation);
    announcement.value =
      "La proposition choisie a remplacé le texte de travail. Elle reste à valider avant publication.";
    emit("applied", result);
  } catch (error) {
    errorMessage.value = errorText(error);
  } finally {
    applyingId.value = null;
  }
}

async function cancel(generation: AiGeneration) {
  errorMessage.value = "";
  try {
    const cancelled = (await api.cancel(generation.id)).data;
    active.value = cancelled;
    Object.assign(generation, cancelled);
    announcement.value = "La génération en attente a été annulée.";
  } catch (error) {
    errorMessage.value = errorText(error);
  }
}

onMounted(loadHistory);
</script>

<template>
  <section
    class="publication-detail ai-assistant"
    aria-labelledby="ai-assistant-title"
  >
    <header class="ai-assistant__header">
      <div>
        <p class="eyebrow">Assistant rédactionnel</p>
        <h2 id="ai-assistant-title">Générer des variantes de texte</h2>
      </div>
      <span class="ai-label">Validation humaine obligatoire</span>
    </header>
    <p class="field-hint">
      Le brief est transmis au fournisseur configuré après masquage des
      coordonnées et secrets détectés. N’ajoutez aucune donnée client inutile.
      Une proposition n’est jamais publiée ni appliquée sans votre action
      explicite.
    </p>
    <p class="status-message" role="status" aria-live="polite">
      {{ announcement }}
    </p>
    <p v-if="errorMessage" class="error-summary" role="alert">
      {{ errorMessage }}
    </p>

    <form class="ai-form" @submit.prevent="generate">
      <div>
        <label for="ai-brief"
          >Brief de génération <span aria-hidden="true">*</span></label
        >
        <textarea
          id="ai-brief"
          v-model="input.brief"
          rows="5"
          minlength="10"
          maxlength="2000"
          required
          aria-describedby="ai-brief-help ai-brief-count"
        />
        <div class="field-meta">
          <span id="ai-brief-help"
            >Décrivez l’objectif, le public et les informations utiles.</span
          >
          <span id="ai-brief-count">{{ input.brief.length }} / 2 000</span>
        </div>
      </div>
      <div class="ai-form__options">
        <label for="ai-tone"
          >Ton
          <select id="ai-tone" v-model="input.tone">
            <option
              v-for="tone in AI_TONES"
              :key="tone.value"
              :value="tone.value"
            >
              {{ tone.label }}
            </option>
          </select>
        </label>
        <label for="ai-length"
          >Longueur
          <select id="ai-length" v-model="input.length">
            <option
              v-for="length in AI_LENGTHS"
              :key="length.value"
              :value="length.value"
            >
              {{ length.label }}
            </option>
          </select>
        </label>
        <label for="ai-language"
          >Langue
          <select id="ai-language" v-model="input.language">
            <option
              v-for="language in AI_LANGUAGES"
              :key="language.value"
              :value="language.value"
            >
              {{ language.label }}
            </option>
          </select>
        </label>
        <label for="ai-count"
          >Nombre de propositions
          <select id="ai-count" v-model.number="input.variantCount">
            <option v-for="count in [2, 3, 4, 5]" :key="count" :value="count">
              {{ count }}
            </option>
          </select>
        </label>
      </div>
      <button class="button-primary" type="submit" :disabled="submitting">
        {{
          submitting
            ? "Génération…"
            : `Générer ${input.variantCount} propositions`
        }}
      </button>
    </form>

    <div v-if="active" class="ai-result" aria-labelledby="ai-result-title">
      <div class="ai-result__heading">
        <div>
          <h3 id="ai-result-title">Propositions</h3>
          <p class="field-hint">
            Fournisseur {{ active.provider }} · modèle {{ active.model }} ·
            prompt {{ active.promptVersion }}
            <template v-if="active.usage.latencyMs">
              · {{ active.usage.latencyMs }} ms</template
            >
          </p>
        </div>
        <span class="status-badge">{{ statusLabels[active.status] }}</span>
      </div>
      <button
        v-if="active.status === 'queued'"
        type="button"
        @click="cancel(active)"
      >
        Annuler la génération
      </button>
      <p
        v-if="active.warnings.includes('sensitive_data_redacted')"
        class="warning-message"
      >
        Certaines données sensibles détectées ont été masquées avant traitement.
      </p>
      <ol v-if="active.variants.length" class="ai-variants">
        <li v-for="(variant, index) in active.variants" :key="variant.id">
          <article>
            <span class="ai-generated-mark"
              >Contenu généré · proposition {{ index + 1 }}</span
            >
            <p class="publication-copy">{{ variant.text }}</p>
            <button
              class="button-secondary"
              type="button"
              :disabled="applyingId !== null"
              @click="applyVariant(active, variant.id)"
            >
              {{
                applyingId === variant.id
                  ? "Application…"
                  : `Utiliser la proposition ${index + 1}`
              }}
            </button>
          </article>
        </li>
      </ol>
    </div>

    <details class="ai-history">
      <summary>Historique des générations ({{ generations.length }})</summary>
      <p v-if="!generations.length">Aucune génération enregistrée.</p>
      <ol v-else>
        <li v-for="generation in generations" :key="generation.id">
          <button
            type="button"
            class="button-link"
            @click="active = generation"
          >
            {{ new Date(generation.createdAt).toLocaleString("fr-FR") }} —
            {{ generation.status }} —
            {{ generation.variants.length }} proposition(s)
          </button>
        </li>
      </ol>
    </details>
  </section>
</template>
