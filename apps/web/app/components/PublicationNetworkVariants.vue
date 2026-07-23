<script setup lang="ts">
import type { NetworkVariant } from "~/types/network-variant";
import type { PublicationStatus, SocialNetwork } from "~/types/publication";

const props = defineProps<{
  publicationId: string;
  sourceText: string;
  contentVersion: number;
  targetNetworks: SocialNetwork[];
  role: "admin" | "agency" | "client";
  publicationStatus: PublicationStatus;
}>();

const labels: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  tiktok: "TikTok",
};
const api = useNetworkVariantsApi();
const variants = ref<NetworkVariant[]>([]);
const selected = ref<SocialNetwork>(props.targetNetworks[0] ?? "facebook");
const draftText = ref(props.sourceText);
const limits = ref<Partial<Record<SocialNetwork, number | null>>>({});
const busy = ref(false);
const announcement = ref("");
const errorMessage = ref("");
const tabButtons = ref<HTMLButtonElement[]>([]);

const canManage = computed(
  () => props.role === "admin" || props.role === "agency",
);
const canEdit = computed(
  () =>
    canManage.value &&
    !["publishing", "published", "archived"].includes(props.publicationStatus),
);
const canApprove = computed(
  () =>
    canEdit.value ||
    (props.role === "client" &&
      props.publicationStatus === "awaiting_client_review"),
);
const selectedVariant = computed(
  () =>
    variants.value.find(
      (variant) =>
        variant.network === selected.value &&
        variant.sourceVersion === props.contentVersion,
    ) ?? variants.value.find((variant) => variant.network === selected.value),
);
const selectedLimit = computed(
  () =>
    selectedVariant.value?.textLimit ?? limits.value[selected.value] ?? null,
);
const isStale = computed(
  () =>
    selectedVariant.value?.status === "stale" ||
    (selectedVariant.value &&
      selectedVariant.value.sourceVersion !== props.contentVersion),
);
const statusLabel = computed(() => {
  if (!selectedVariant.value) return "Texte source utilisé";
  if (isStale.value) return "Obsolète";
  if (selectedVariant.value.status === "approved") return "Approuvée";
  return "Brouillon à valider";
});

function syncDraft() {
  draftText.value = selectedVariant.value?.text ?? props.sourceText;
}

function errorText(error: unknown) {
  return (
    getApiErrors(error)[0]?.message ||
    (error instanceof Error ? error.message : "L’action a échoué.")
  );
}

async function load() {
  errorMessage.value = "";
  try {
    const result = await api.list(props.publicationId);
    variants.value = result.data;
    limits.value = result.meta.limits;
    syncDraft();
  } catch (error) {
    errorMessage.value = errorText(error);
  }
}

function selectNetwork(network: SocialNetwork) {
  selected.value = network;
  syncDraft();
}

function moveTab(event: KeyboardEvent, index: number) {
  const offset =
    event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
  if (!offset) return;
  event.preventDefault();
  const next =
    (index + offset + props.targetNetworks.length) %
    props.targetNetworks.length;
  const network = props.targetNetworks[next];
  if (!network) return;
  selectNetwork(network);
  tabButtons.value[next]?.focus();
}

function replaceVariant(next: NetworkVariant) {
  variants.value = [
    next,
    ...variants.value.filter((variant) => variant.id !== next.id),
  ];
  syncDraft();
}

async function generate(networks: SocialNetwork[]) {
  busy.value = true;
  errorMessage.value = "";
  announcement.value = "Génération des variantes en cours.";
  try {
    const result = await api.generate(props.publicationId, {
      networks,
      tone: "professional",
      length: "medium",
      language: "fr",
    });
    for (const variant of result.data) replaceVariant(variant);
    if (networks[0]) selectNetwork(networks[0]);
    announcement.value = `${result.data.length} variante(s) générée(s). Aucune n’a été publiée.`;
  } catch (error) {
    errorMessage.value = errorText(error);
  } finally {
    busy.value = false;
  }
}

async function save() {
  busy.value = true;
  errorMessage.value = "";
  try {
    const result = selectedVariant.value
      ? await api.update(selectedVariant.value.id, draftText.value)
      : await api.create(props.publicationId, selected.value, draftText.value);
    replaceVariant(result.data);
    announcement.value = `Variante ${labels[selected.value]} enregistrée en brouillon.`;
  } catch (error) {
    errorMessage.value = errorText(error);
  } finally {
    busy.value = false;
  }
}

async function approve() {
  if (!selectedVariant.value) return;
  busy.value = true;
  errorMessage.value = "";
  try {
    replaceVariant((await api.approve(selectedVariant.value.id)).data);
    announcement.value = `Variante ${labels[selected.value]} approuvée pour la version ${props.contentVersion}.`;
  } catch (error) {
    errorMessage.value = errorText(error);
  } finally {
    busy.value = false;
  }
}

watch(() => props.contentVersion, load);
onMounted(load);
</script>

<template>
  <section
    class="publication-detail network-variants"
    aria-labelledby="network-variants-title"
  >
    <header class="ai-assistant__header">
      <div>
        <p class="eyebrow">Adaptation multi-réseaux</p>
        <h2 id="network-variants-title">Variantes par réseau</h2>
      </div>
      <span class="ai-label">Version source {{ contentVersion }}</span>
    </header>
    <p class="field-hint">
      Chaque réseau conserve son propre texte. Seule une variante approuvée de
      la version courante remplace le texte source au moment de la
      programmation.
    </p>
    <p class="status-message" role="status" aria-live="polite">
      {{ announcement }}
    </p>
    <p v-if="errorMessage" class="error-summary" role="alert">
      {{ errorMessage }}
    </p>

    <div v-if="canEdit" class="network-variant-actions">
      <button
        type="button"
        class="button-primary"
        :disabled="busy"
        @click="generate(targetNetworks)"
      >
        Générer pour tous les réseaux
      </button>
      <span class="field-hint">Validation humaine obligatoire</span>
    </div>

    <div class="network-tabs" role="tablist" aria-label="Réseaux ciblés">
      <button
        v-for="(network, index) in targetNetworks"
        :id="`network-tab-${network}`"
        :key="network"
        :ref="
          (element) => {
            if (element) tabButtons[index] = element as HTMLButtonElement;
          }
        "
        type="button"
        role="tab"
        :aria-selected="selected === network"
        :aria-controls="`network-panel-${network}`"
        :tabindex="selected === network ? 0 : -1"
        @click="selectNetwork(network)"
        @keydown="moveTab($event, index)"
      >
        {{ labels[network] }}
        <span
          v-if="
            variants.some(
              (item) => item.network === network && item.status === 'stale',
            )
          "
        >
          · obsolète
        </span>
      </button>
    </div>

    <div
      :id="`network-panel-${selected}`"
      class="network-panel"
      role="tabpanel"
      :aria-labelledby="`network-tab-${selected}`"
      tabindex="0"
    >
      <div class="ai-result__heading">
        <div>
          <h3>{{ labels[selected] }}</h3>
          <p class="field-hint">
            {{
              selectedVariant?.generatedByAi
                ? "Générée avec assistance IA"
                : "Édition humaine"
            }}
          </p>
        </div>
        <span class="status-badge">{{ statusLabel }}</span>
      </div>

      <div v-if="isStale" class="warning-message" role="status">
        Cette variante dépend d’une ancienne version du texte. Elle ne sera pas
        utilisée : le texte source reste le fallback jusqu’à régénération.
      </div>

      <div class="network-diff" aria-label="Comparaison textuelle">
        <article>
          <h4>Texte source — version {{ contentVersion }}</h4>
          <p class="publication-copy">{{ sourceText }}</p>
        </article>
        <article>
          <h4>Variante {{ labels[selected] }}</h4>
          <p class="publication-copy">
            {{
              selectedVariant?.text ||
              "Aucune variante : le texte source sera utilisé."
            }}
          </p>
        </article>
      </div>

      <div v-if="canEdit" class="network-editor">
        <label :for="`network-text-${selected}`"
          >Texte pour {{ labels[selected] }}</label
        >
        <textarea
          :id="`network-text-${selected}`"
          v-model="draftText"
          rows="6"
          :maxlength="selectedLimit ?? 20000"
          :aria-describedby="`network-count-${selected}`"
        />
        <div class="field-meta">
          <span :id="`network-count-${selected}`">
            {{ draftText.length }} caractère(s)
            <template v-if="selectedLimit"> / {{ selectedLimit }}</template>
            <template v-else> · limite officielle à configurer</template>
          </span>
          <span
            >La mise en forme par couleur n’est pas nécessaire pour
            comparer.</span
          >
        </div>
        <div class="network-variant-actions">
          <button
            type="button"
            class="button-secondary"
            :disabled="busy || isStale"
            @click="save"
          >
            Enregistrer le brouillon
          </button>
          <button
            type="button"
            class="button-secondary"
            :disabled="busy"
            @click="generate([selected])"
          >
            {{ selectedVariant ? "Régénérer" : "Générer" }}
          </button>
        </div>
      </div>

      <button
        v-if="
          canApprove &&
          selectedVariant &&
          selectedVariant.status !== 'approved' &&
          !isStale
        "
        type="button"
        class="button-primary"
        :disabled="busy"
        @click="approve"
      >
        Approuver la variante {{ labels[selected] }}
      </button>
    </div>
  </section>
</template>
