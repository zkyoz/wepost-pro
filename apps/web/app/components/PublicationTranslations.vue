<script setup lang="ts">
import type { AppLocale, UserRole } from "~/types/auth";
import type { PublicationTranslation } from "~/types/translation";

const props = defineProps<{
  publicationId: string;
  sourceText: string;
  contentVersion: number;
  role: UserRole;
}>();

const api = useTranslationsApi();
const { t, formatDateTime } = useLocale();
const translations = ref<PublicationTranslation[]>([]);
const sourceLocale = ref<AppLocale>("fr");
const targetLocale = ref<AppLocale>("en");
const text = ref("");
const loading = ref(false);
const announcement = ref("");
const error = ref("");
const canManage = computed(
  () => props.role === "admin" || props.role === "agency",
);
const current = computed(() =>
  translations.value.find(
    (item) =>
      item.targetLocale === targetLocale.value &&
      item.sourceVersion === props.contentVersion,
  ),
);
const history = computed(() =>
  translations.value.filter(
    (item) =>
      item.targetLocale === targetLocale.value &&
      item.sourceVersion !== props.contentVersion,
  ),
);

watch(current, (value) => {
  text.value = value?.text ?? "";
});

watch(sourceLocale, (locale) => {
  targetLocale.value = locale === "fr" ? "en" : "fr";
});

async function refresh() {
  const response = await api.list(props.publicationId);
  translations.value = response.data;
  text.value = current.value?.text ?? "";
}

async function run(
  action: () => Promise<PublicationTranslation>,
  message: string,
) {
  loading.value = true;
  error.value = "";
  announcement.value = "";
  try {
    const result = await action();
    const index = translations.value.findIndex((item) => item.id === result.id);
    if (index >= 0) translations.value[index] = result;
    else translations.value.unshift(result);
    text.value = result.text;
    announcement.value = message;
  } catch {
    error.value = t("translations.error");
  } finally {
    loading.value = false;
  }
}

function generate() {
  return run(
    async () =>
      (
        await api.generate(props.publicationId, {
          sourceLocale: sourceLocale.value,
          targetLocale: targetLocale.value,
          sourceVersion: props.contentVersion,
        })
      ).data,
    t("translations.generated"),
  );
}

function save() {
  return run(
    async () =>
      (
        await api.update(props.publicationId, targetLocale.value, {
          sourceLocale: sourceLocale.value,
          sourceVersion: props.contentVersion,
          text: text.value,
        })
      ).data,
    t("translations.saved"),
  );
}

function approve() {
  return run(
    async () =>
      (
        await api.approve(
          props.publicationId,
          targetLocale.value,
          props.contentVersion,
        )
      ).data,
    t("translations.approved"),
  );
}

await refresh();
</script>

<template>
  <section class="translation-editor" aria-labelledby="translation-title">
    <div class="translation-editor__heading">
      <div>
        <h2 id="translation-title">{{ t("translations.title") }}</h2>
        <p>{{ t("translations.description") }}</p>
      </div>
      <p class="translation-editor__version">
        {{ t("translations.version", { version: contentVersion }) }}
      </p>
    </div>

    <p
      v-if="announcement"
      class="status-message"
      role="status"
      aria-live="polite"
    >
      {{ announcement }}
    </p>
    <p v-if="error" class="error-summary" role="alert">{{ error }}</p>

    <div class="translation-editor__languages">
      <label>
        {{ t("translations.sourceLanguage") }}
        <select v-model="sourceLocale" :disabled="loading">
          <option value="fr">{{ t("common.french") }}</option>
          <option value="en">{{ t("common.english") }}</option>
        </select>
      </label>
      <label>
        {{ t("translations.targetLanguage") }}
        <select v-model="targetLocale" :disabled="loading">
          <option value="fr">{{ t("common.french") }}</option>
          <option value="en">{{ t("common.english") }}</option>
        </select>
      </label>
    </div>

    <div class="translation-editor__columns">
      <article :lang="sourceLocale">
        <h3>{{ t("translations.source") }}</h3>
        <p class="publication-copy">{{ sourceText }}</p>
      </article>
      <div :lang="targetLocale">
        <label for="publication-translation">{{
          t("translations.translatedText")
        }}</label>
        <textarea
          id="publication-translation"
          v-model="text"
          rows="8"
          maxlength="10000"
          :readonly="!canManage"
          :disabled="loading"
        />
        <p v-if="current" class="translation-editor__metadata">
          <strong>
            {{
              current.status === "approved"
                ? t("translations.approvedStatus")
                : current.status === "stale"
                  ? t("translations.stale")
                  : t("translations.draft")
            }}
          </strong>
          ·
          {{
            current.generatedByAi
              ? t("translations.generatedByAi")
              : t("translations.manuallyWritten")
          }}
          · {{ formatDateTime(current.updatedAt) }}
        </p>
        <p v-else>{{ t("translations.noTranslation") }}</p>
      </div>
    </div>

    <div v-if="canManage" class="page-actions">
      <button type="button" :disabled="loading" @click="generate">
        {{
          loading ? t("translations.generating") : t("translations.generate")
        }}
      </button>
      <button type="button" :disabled="loading || !text.trim()" @click="save">
        {{ t("translations.saveDraft") }}
      </button>
      <button
        type="button"
        :disabled="loading || !current || current.status !== 'draft'"
        @click="approve"
      >
        {{ t("translations.approve") }}
      </button>
    </div>

    <details v-if="history.length" class="translation-editor__history">
      <summary>{{ t("translations.stale") }} ({{ history.length }})</summary>
      <ul>
        <li v-for="item in history" :key="item.id">
          {{ t("translations.version", { version: item.sourceVersion }) }} —
          <span :lang="item.targetLocale">{{ item.text }}</span>
        </li>
      </ul>
    </details>
  </section>
</template>
