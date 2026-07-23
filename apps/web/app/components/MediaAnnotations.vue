<script setup lang="ts">
import type {
  AnnotatableMedia,
  AnnotationListMeta,
  AnnotationPayload,
  AnnotationShape,
  MediaAnnotation,
} from "~/types/annotation";
import { getApiErrors } from "~/utils/api-errors";

const props = defineProps<{
  publicationId: string;
  contentVersion: number;
  media: AnnotatableMedia;
}>();

const api = useAnnotationsApi();
const annotations = ref<MediaAnnotation[]>([]);
const meta = ref<AnnotationListMeta>();
const loading = ref(true);
const submitting = ref(false);
const errorMessage = ref("");
const announcement = ref("");
const selectionMode = ref<AnnotationShape | null>(null);
const editingId = ref<string | null>(null);
const dragStart = ref<{ x: number; y: number } | null>(null);
const listHeading = useTemplateRef<HTMLElement>("listHeading");

const form = reactive({
  shape: "point" as AnnotationShape,
  x: 50,
  y: 50,
  width: 25,
  height: 25,
  body: "",
});

const activeAnnotations = computed(() =>
  annotations.value.filter((item) => !item.deletedAt && !item.historical),
);

function errorText(error: unknown) {
  return (
    getApiErrors(error)[0]?.message ??
    (error instanceof Error ? error.message : "Une erreur est survenue.")
  );
}

function numberFor(id: string) {
  return annotations.value.findIndex((item) => item.id === id) + 1;
}

function markerStyle(item: MediaAnnotation) {
  return {
    left: `${item.x * 100}%`,
    top: `${item.y * 100}%`,
    width:
      item.shape === "rectangle" ? `${(item.width ?? 0) * 100}%` : undefined,
    height:
      item.shape === "rectangle" ? `${(item.height ?? 0) * 100}%` : undefined,
  };
}

const draftStyle = computed(() => ({
  left: `${form.x}%`,
  top: `${form.y}%`,
  width: form.shape === "rectangle" ? `${form.width}%` : undefined,
  height: form.shape === "rectangle" ? `${form.height}%` : undefined,
}));

function normalizedPointer(event: PointerEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
  };
}

function percentage(value: number) {
  return Math.round(value * 1000) / 10;
}

function beginPointerSelection(event: PointerEvent) {
  if (!selectionMode.value) return;
  const point = normalizedPointer(event);
  if (selectionMode.value === "point") {
    Object.assign(form, {
      shape: "point",
      x: percentage(point.x),
      y: percentage(point.y),
    });
    announcement.value =
      "Position du point définie. Renseignez maintenant le commentaire.";
    return;
  }
  dragStart.value = point;
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
}

function finishPointerSelection(event: PointerEvent) {
  if (selectionMode.value !== "rectangle" || !dragStart.value) return;
  const end = normalizedPointer(event);
  const start = dragStart.value;
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.max(0.02, Math.abs(end.x - start.x));
  const height = Math.max(0.02, Math.abs(end.y - start.y));
  Object.assign(form, {
    shape: "rectangle",
    x: percentage(x),
    y: percentage(y),
    width: percentage(Math.min(width, 1 - x)),
    height: percentage(Math.min(height, 1 - y)),
  });
  dragStart.value = null;
  announcement.value =
    "Rectangle défini. Renseignez maintenant le commentaire.";
}

function payload(): AnnotationPayload {
  return {
    shape: form.shape,
    x: form.x / 100,
    y: form.y / 100,
    width: form.shape === "rectangle" ? form.width / 100 : null,
    height: form.shape === "rectangle" ? form.height / 100 : null,
    body: form.body,
  };
}

function resetForm() {
  Object.assign(form, {
    shape: "point",
    x: 50,
    y: 50,
    width: 25,
    height: 25,
    body: "",
  });
  selectionMode.value = null;
  editingId.value = null;
}

async function focusAnnotation(id: string) {
  await nextTick();
  document.getElementById(`annotation-${id}`)?.focus();
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await api.list(props.publicationId, props.media.id);
    annotations.value = result.data;
    meta.value = result.meta;
  } catch (error) {
    errorMessage.value = errorText(error);
  } finally {
    loading.value = false;
  }
}

async function submit() {
  submitting.value = true;
  errorMessage.value = "";
  try {
    if (editingId.value) {
      const result = await api.update(editingId.value, payload());
      const index = annotations.value.findIndex(
        (item) => item.id === editingId.value,
      );
      if (index >= 0) annotations.value[index] = result.data;
      announcement.value = `L’annotation ${numberFor(result.data.id)} a été modifiée.`;
      const id = result.data.id;
      resetForm();
      await focusAnnotation(id);
      return;
    }
    const result = await api.create(
      props.publicationId,
      props.media.id,
      payload(),
    );
    annotations.value.push(result.data);
    if (meta.value) meta.value.openCount += 1;
    announcement.value = `L’annotation ${numberFor(result.data.id)} a été ajoutée.`;
    const id = result.data.id;
    resetForm();
    await focusAnnotation(id);
  } catch (error) {
    errorMessage.value = errorText(error);
  } finally {
    submitting.value = false;
  }
}

function startEdit(item: MediaAnnotation) {
  editingId.value = item.id;
  Object.assign(form, {
    shape: item.shape,
    x: item.x * 100,
    y: item.y * 100,
    width: (item.width ?? 0.25) * 100,
    height: (item.height ?? 0.25) * 100,
    body: item.body ?? "",
  });
  document.getElementById(`annotation-body-${props.media.id}`)?.focus();
}

async function remove(item: MediaAnnotation) {
  if (!window.confirm(`Supprimer l’annotation ${numberFor(item.id)} ?`)) return;
  errorMessage.value = "";
  try {
    await api.remove(item.id);
    item.deletedAt = new Date().toISOString();
    item.body = null;
    item.canEdit = false;
    item.canDelete = false;
    if (meta.value && !item.historical)
      meta.value.openCount = Math.max(0, meta.value.openCount - 1);
    announcement.value = `L’annotation ${numberFor(item.id)} a été supprimée.`;
    await nextTick();
    listHeading.value?.focus();
  } catch (error) {
    errorMessage.value = errorText(error);
  }
}

watch(() => props.media.id, load);
onMounted(load);
</script>

<template>
  <section
    class="annotation-workspace"
    :aria-labelledby="`annotation-title-${media.id}`"
  >
    <div class="annotation-workspace__heading">
      <div>
        <h3 :id="`annotation-title-${media.id}`">
          Annotations de {{ media.originalName }}
        </h3>
        <p class="form-field__hint">
          Publication version
          {{ meta?.currentPublicationVersion ?? contentVersion }} · média
          {{ (meta?.mediaVersion ?? "chargement").slice(0, 12) }}
        </p>
      </div>
      <p v-if="meta" class="annotation-count">
        {{ meta.openCount }} annotation{{
          meta.openCount > 1 ? "s" : ""
        }}
        active{{ meta.openCount > 1 ? "s" : "" }}
      </p>
    </div>

    <p class="status-message" role="status" aria-live="polite">
      {{ announcement }}
    </p>
    <p v-if="errorMessage" class="error-summary" role="alert">
      {{ errorMessage }}
    </p>

    <div class="annotation-layout">
      <div>
        <div class="annotation-viewer">
          <img
            v-if="media.mimeType.startsWith('image/')"
            :src="media.readUrl"
            :alt="
              media.isDecorative ? '' : (media.altText ?? media.originalName)
            "
          />
          <video
            v-else
            :src="media.readUrl"
            controls
            preload="metadata"
            :aria-label="media.altText || media.originalName"
          />
          <div class="annotation-overlay" aria-label="Annotations visuelles">
            <button
              v-for="item in activeAnnotations"
              :key="item.id"
              type="button"
              class="annotation-marker"
              :class="`annotation-marker--${item.shape}`"
              :style="markerStyle(item)"
              :aria-label="`Annotation ${numberFor(item.id)} : ${item.body}`"
              @click="focusAnnotation(item.id)"
            >
              <span>{{ numberFor(item.id) }}</span>
            </button>
            <span
              v-if="selectionMode || editingId || form.body"
              class="annotation-marker annotation-marker--draft"
              :class="`annotation-marker--${form.shape}`"
              :style="draftStyle"
              aria-hidden="true"
            />
            <button
              v-if="selectionMode"
              type="button"
              class="annotation-selector"
              :aria-label="
                selectionMode === 'point'
                  ? 'Cliquer pour placer le point'
                  : 'Faire glisser pour tracer le rectangle'
              "
              @pointerdown="beginPointerSelection"
              @pointerup="finishPointerSelection"
            />
          </div>
        </div>
        <div class="annotation-pointer-actions">
          <button
            type="button"
            :aria-pressed="selectionMode === 'point'"
            @click="selectionMode = 'point'"
          >
            Placer un point à la souris
          </button>
          <button
            type="button"
            :aria-pressed="selectionMode === 'rectangle'"
            @click="selectionMode = 'rectangle'"
          >
            Tracer un rectangle
          </button>
        </div>
      </div>

      <form class="annotation-form" @submit.prevent="submit">
        <fieldset>
          <legend>
            {{ editingId ? "Modifier l’annotation" : "Nouvelle annotation" }}
          </legend>
          <p class="form-field__hint">
            Alternative clavier complète : toutes les coordonnées sont exprimées
            en pourcentage.
          </p>
          <label>
            Forme
            <select v-model="form.shape">
              <option value="point">Point</option>
              <option value="rectangle">Rectangle</option>
            </select>
          </label>
          <div class="annotation-coordinates">
            <label
              >X (%)
              <input
                v-model.number="form.x"
                type="number"
                min="0"
                max="100"
                step="0.1"
                required
            /></label>
            <label
              >Y (%)
              <input
                v-model.number="form.y"
                type="number"
                min="0"
                max="100"
                step="0.1"
                required
            /></label>
            <label v-if="form.shape === 'rectangle'">
              Largeur (%)
              <input
                v-model.number="form.width"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                required
              />
            </label>
            <label v-if="form.shape === 'rectangle'">
              Hauteur (%)
              <input
                v-model.number="form.height"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                required
              />
            </label>
          </div>
          <button
            type="button"
            class="button-secondary"
            @click="Object.assign(form, { x: 50, y: 50 })"
          >
            Positionner au centre
          </button>
          <label :for="`annotation-body-${media.id}`"
            >Commentaire obligatoire</label
          >
          <textarea
            :id="`annotation-body-${media.id}`"
            v-model="form.body"
            rows="4"
            maxlength="2000"
            required
            aria-describedby="annotation-text-help"
          />
          <p id="annotation-text-help" class="form-field__hint">
            Ce texte est la source de vérité accessible de l’annotation.
          </p>
          <div class="page-actions">
            <button class="button-primary" type="submit" :disabled="submitting">
              {{
                submitting
                  ? "Enregistrement…"
                  : editingId
                    ? "Enregistrer"
                    : "Ajouter l’annotation"
              }}
            </button>
            <button v-if="editingId" type="button" @click="resetForm">
              Annuler
            </button>
          </div>
        </fieldset>
      </form>
    </div>

    <h4 ref="listHeading" tabindex="-1">Liste textuelle chronologique</h4>
    <p v-if="loading">Chargement des annotations…</p>
    <p v-else-if="annotations.length === 0" class="empty-state">
      Aucune annotation pour ce média.
    </p>
    <ol v-else class="annotation-list">
      <li
        v-for="item in annotations"
        :id="`annotation-${item.id}`"
        :key="item.id"
        tabindex="-1"
        :class="{ 'annotation-list__historical': item.historical }"
      >
        <div class="annotation-list__heading">
          <strong>Annotation {{ numberFor(item.id) }}</strong>
          <span v-if="item.deletedAt">Supprimée</span>
          <span v-else-if="item.historical"
            >Historique — version {{ item.publicationVersion }}</span
          >
          <span v-else>Active — version {{ item.publicationVersion }}</span>
        </div>
        <p v-if="item.body" class="publication-copy">{{ item.body }}</p>
        <p v-else class="form-field__hint">Annotation supprimée.</p>
        <p class="form-field__hint">
          {{ item.author.displayName }} ·
          <time :datetime="item.createdAt">{{
            new Date(item.createdAt).toLocaleString("fr-FR")
          }}</time>
          · {{ item.shape === "point" ? "point" : "rectangle" }} à
          {{ Math.round(item.x * 100) }} %, {{ Math.round(item.y * 100) }} %
        </p>
        <p v-if="item.commentId">
          <a :href="`#comment-${item.commentId}`">Voir le commentaire lié</a>
        </p>
        <div v-if="item.canEdit || item.canDelete" class="page-actions">
          <button v-if="item.canEdit" type="button" @click="startEdit(item)">
            Modifier
          </button>
          <button
            v-if="item.canDelete"
            class="button-danger"
            type="button"
            @click="remove(item)"
          >
            Supprimer
          </button>
        </div>
      </li>
    </ol>
  </section>
</template>
