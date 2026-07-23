<script setup lang="ts">
import type { MediaAsset, MediaListMeta } from "~/types/media";
import { getApiErrors } from "~/utils/api-errors";

const props = defineProps<{
  publicationId: string;
  contentVersion: number;
  canManage: boolean;
}>();
const api = useMediaApi();
const media = ref<MediaAsset[]>([]);
const meta = ref<MediaListMeta>();
const selectedFile = ref<File>();
const altText = ref("");
const isDecorative = ref(false);
const progress = ref(0);
const loading = ref(true);
const submitting = ref(false);
const announcement = ref("");
const errorMessage = ref("");
const selectedAnnotationMediaId = ref<string>();
const selectedAnnotationMedia = computed(() =>
  media.value.find((item) => item.id === selectedAnnotationMediaId.value),
);

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} octets`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 ** 2).toFixed(1)} Mo`;
}

function errorText(error: unknown) {
  return (
    getApiErrors(error)[0]?.message ??
    (error instanceof Error ? error.message : "Une erreur est survenue.")
  );
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await api.list(props.publicationId);
    media.value = result.data;
    meta.value = result.meta;
  } catch (error) {
    errorMessage.value = errorText(error);
  } finally {
    loading.value = false;
  }
}

function selectFile(event: Event) {
  selectedFile.value = (event.target as HTMLInputElement).files?.[0];
}

async function submitUpload() {
  if (!selectedFile.value) return;
  submitting.value = true;
  errorMessage.value = "";
  try {
    await api.upload(
      props.publicationId,
      selectedFile.value,
      {
        altText: isDecorative.value ? null : altText.value,
        isDecorative: isDecorative.value,
      },
      (value) => (progress.value = value),
    );
    announcement.value = `Le média ${selectedFile.value.name} a été ajouté.`;
    selectedFile.value = undefined;
    altText.value = "";
    isDecorative.value = false;
    await load();
  } catch (error) {
    errorMessage.value = errorText(error);
  } finally {
    submitting.value = false;
  }
}

async function saveAlternative(item: MediaAsset) {
  errorMessage.value = "";
  try {
    const result = await api.update(item.id, {
      altText: item.isDecorative ? null : item.altText,
      isDecorative: item.isDecorative,
    });
    Object.assign(item, result.data);
    announcement.value = `L’alternative de ${item.originalName} a été enregistrée.`;
  } catch (error) {
    errorMessage.value = errorText(error);
  }
}

async function move(index: number, offset: -1 | 1) {
  const target = index + offset;
  if (target < 0 || target >= media.value.length) return;
  const reordered = [...media.value];
  [reordered[index], reordered[target]] = [
    reordered[target]!,
    reordered[index]!,
  ];
  errorMessage.value = "";
  try {
    await api.reorder(
      props.publicationId,
      reordered.map((item) => item.id),
    );
    media.value = reordered.map((item, position) => ({ ...item, position }));
    announcement.value = `L’ordre des médias a été modifié. ${reordered[target]?.originalName} est en position ${target + 1}.`;
  } catch (error) {
    errorMessage.value = errorText(error);
  }
}

async function remove(item: MediaAsset) {
  if (!window.confirm(`Supprimer « ${item.originalName} » ?`)) return;
  errorMessage.value = "";
  try {
    await api.remove(item.id);
    media.value = media.value.filter((candidate) => candidate.id !== item.id);
    announcement.value = `Le média ${item.originalName} a été placé dans la corbeille.`;
  } catch (error) {
    errorMessage.value = errorText(error);
  }
}

onMounted(load);
</script>

<template>
  <section
    class="publication-detail media-manager"
    aria-labelledby="media-title"
  >
    <div class="media-manager__heading">
      <div>
        <h2 id="media-title">Médias</h2>
        <p v-if="meta" class="form-field__hint">
          {{ humanSize(meta.storageBytes) }} pour cette publication.
        </p>
      </div>
    </div>

    <p class="status-message" role="status" aria-live="polite">
      {{ announcement }}
    </p>
    <p v-if="errorMessage" class="error-summary" role="alert">
      {{ errorMessage }}
    </p>

    <form v-if="canManage" class="media-upload" @submit.prevent="submitUpload">
      <div class="form-field">
        <label for="publication-media-file"
          >Fichier image ou vidéo <span aria-hidden="true">*</span></label
        >
        <input
          id="publication-media-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
          required
          @change="selectFile"
        />
        <p class="form-field__hint">
          20 Mo maximum. PNG, JPEG, WebP, GIF ou MP4.
        </p>
      </div>
      <div class="form-field">
        <label for="publication-media-alt">Alternative textuelle</label>
        <input
          id="publication-media-alt"
          v-model="altText"
          maxlength="2000"
          :disabled="isDecorative"
          :required="!isDecorative"
          aria-describedby="publication-media-alt-hint"
        />
        <p id="publication-media-alt-hint" class="form-field__hint">
          Décrivez l’information portée par l’image, ou marquez-la décorative.
        </p>
      </div>
      <label class="check-control">
        <input v-model="isDecorative" type="checkbox" />
        Cette image est décorative
      </label>
      <div v-if="submitting" class="media-progress" aria-live="polite">
        <label for="media-upload-progress">Transfert : {{ progress }} %</label>
        <progress id="media-upload-progress" :value="progress" max="100" />
      </div>
      <button
        class="button-primary"
        type="submit"
        :disabled="submitting || !selectedFile"
      >
        {{ submitting ? "Téléversement…" : "Téléverser et associer" }}
      </button>
    </form>

    <p v-if="loading">Chargement des médias…</p>
    <p v-else-if="media.length === 0" class="empty-state">
      Aucun média n’est encore associé à cette publication.
    </p>
    <ol v-else class="media-list">
      <li v-for="(item, index) in media" :key="item.id" class="media-card">
        <img
          v-if="item.mimeType.startsWith('image/')"
          class="media-card__preview"
          :src="item.readUrl"
          :alt="item.isDecorative ? '' : (item.altText ?? '')"
        />
        <video
          v-else
          class="media-card__preview"
          :src="item.readUrl"
          controls
          preload="metadata"
          :aria-label="item.altText || item.originalName"
        />
        <div class="media-card__content">
          <h3>{{ item.originalName }}</h3>
          <p>{{ item.mimeType }} — {{ humanSize(item.sizeBytes) }}</p>
          <template v-if="canManage">
            <div class="form-field">
              <label :for="`media-alt-${item.id}`">Alternative textuelle</label>
              <input
                :id="`media-alt-${item.id}`"
                v-model="item.altText"
                maxlength="2000"
                :disabled="item.isDecorative"
                :required="!item.isDecorative"
              />
            </div>
            <label class="check-control">
              <input v-model="item.isDecorative" type="checkbox" />
              Image décorative
            </label>
            <div class="page-actions">
              <button type="button" @click="saveAlternative(item)">
                Enregistrer l’alternative de {{ item.originalName }}
              </button>
              <button
                type="button"
                :disabled="index === 0"
                @click="move(index, -1)"
              >
                Monter {{ item.originalName }}
              </button>
              <button
                type="button"
                :disabled="index === media.length - 1"
                @click="move(index, 1)"
              >
                Descendre {{ item.originalName }}
              </button>
              <button class="button-danger" type="button" @click="remove(item)">
                Supprimer {{ item.originalName }}
              </button>
            </div>
          </template>
          <p v-else>
            {{ item.isDecorative ? "Image décorative" : item.altText }}
          </p>
          <button
            type="button"
            class="button-secondary"
            :aria-expanded="selectedAnnotationMediaId === item.id"
            :aria-controls="`media-annotations-${item.id}`"
            @click="selectedAnnotationMediaId = item.id"
          >
            Ouvrir les annotations de {{ item.originalName }}
          </button>
        </div>
      </li>
    </ol>
    <div
      v-if="selectedAnnotationMedia"
      :id="`media-annotations-${selectedAnnotationMedia.id}`"
    >
      <MediaAnnotations
        :publication-id="publicationId"
        :content-version="contentVersion"
        :media="selectedAnnotationMedia"
      />
    </div>
  </section>
</template>
