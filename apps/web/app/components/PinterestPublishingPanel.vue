<script setup lang="ts">
import type { UserRole } from "~/types/auth";
import type {
  PinterestAccount,
  PinterestSchedule,
  PinterestValidation,
} from "~/types/pinterest";
import { getApiErrors } from "~/utils/api-errors";

const props = defineProps<{
  publicationId: string;
  role: UserRole;
  status: string;
  scheduledAt: string | null;
  publicationTitle: string;
  publicationText: string;
}>();
const emit = defineEmits<{ scheduled: [] }>();
const api = usePinterestApi();
const canManage = computed(
  () => props.role === "admin" || props.role === "agency",
);
const accounts = ref<PinterestAccount[]>([]);
const accountId = ref("");
const boardId = ref("");
const title = ref(props.publicationTitle.slice(0, 100));
const description = ref(props.publicationText.slice(0, 800));
const link = ref("");
const runAt = ref(
  props.scheduledAt
    ? new Date(props.scheduledAt).toISOString().slice(0, 16)
    : "",
);
const schedule = ref<PinterestSchedule | null>(null);
const validation = ref<PinterestValidation | null>(null);
const isLoading = ref(false);
const isHydrated = ref(false);
const announcement = ref("");
const error = ref("");
const selectedAccount = computed(() =>
  accounts.value.find((account) => account.id === accountId.value),
);
const boards = computed(() => selectedAccount.value?.boards ?? []);
watch(accountId, () => {
  boardId.value = boards.value[0]?.id ?? "";
});

function pinInput() {
  return {
    accountId: accountId.value,
    boardId: boardId.value,
    title: title.value,
    description: description.value,
    link: link.value || null,
  };
}

onMounted(() => {
  isHydrated.value = true;
});

function errorText(cause: unknown) {
  return (
    getApiErrors(cause)[0]?.message ??
    (cause instanceof Error ? cause.message : "L’action Pinterest a échoué.")
  );
}

const scheduleLabels: Record<PinterestSchedule["status"], string> = {
  queued: "En attente",
  publishing: "Publication en cours",
  published: "Publiée",
  failed: "Échec",
  cancelled: "Annulée",
};

const attemptLabels: Record<
  PinterestSchedule["attempts"][number]["result"],
  string
> = {
  started: "En cours",
  success: "Réussie",
  transient_failure: "Échec temporaire",
  permanent_failure: "Échec définitif",
  skipped: "Ignorée car déjà publiée",
};

async function load() {
  schedule.value = (await api.status(props.publicationId)).data;
  if (canManage.value) {
    accounts.value = (await api.accounts()).data.filter(
      (account) => account.status === "connected",
    );
    accountId.value ||= accounts.value[0]?.id ?? "";
    boardId.value ||= accounts.value[0]?.boards[0]?.id ?? "";
  }
}

async function validate() {
  if (!accountId.value) return;
  error.value = "";
  isLoading.value = true;
  try {
    validation.value = (
      await api.validate(props.publicationId, pinInput())
    ).data;
    announcement.value = validation.value.valid
      ? "La publication est compatible avec Pinterest."
      : "La validation Pinterest contient des erreurs.";
  } catch (cause) {
    error.value = errorText(cause);
  } finally {
    isLoading.value = false;
  }
}

async function program() {
  if (!accountId.value) return;
  error.value = "";
  isLoading.value = true;
  try {
    schedule.value = (
      await api.schedule(props.publicationId, {
        ...pinInput(),
        runAt: runAt.value ? new Date(runAt.value).toISOString() : null,
      })
    ).data;
    announcement.value = "La publication Pinterest est programmée.";
    emit("scheduled");
  } catch (cause) {
    error.value = errorText(cause);
  } finally {
    isLoading.value = false;
  }
}

async function retry() {
  if (!schedule.value) return;
  isLoading.value = true;
  error.value = "";
  try {
    schedule.value = (await api.retry(schedule.value.id)).data;
    announcement.value = "La relance Pinterest est programmée.";
  } catch (cause) {
    error.value = errorText(cause);
  } finally {
    isLoading.value = false;
  }
}

await load();
</script>

<template>
  <section
    class="publication-detail"
    aria-labelledby="pinterest-publishing-title"
  >
    <h2 id="pinterest-publishing-title">Publication Pinterest</h2>
    <p class="status-message" aria-live="polite" role="status">
      {{ announcement }}
    </p>
    <p v-if="error" class="error-summary" role="alert">{{ error }}</p>

    <p v-if="schedule">
      Statut : <strong>{{ scheduleLabels[schedule.status] }}</strong> — version
      {{ schedule.publicationVersion }}, prévue le
      <time :datetime="schedule.runAt">{{
        new Date(schedule.runAt).toLocaleString("fr-FR")
      }}</time
      >.
    </p>
    <p v-else>Aucune programmation Pinterest.</p>

    <div v-if="canManage && !schedule" class="pinterest-controls">
      <p v-if="!accounts.length">
        Aucun compte Pinterest connecté.
        <NuxtLink to="/settings/pinterest"
          >Connecter un compte Pinterest</NuxtLink
        >.
      </p>
      <template v-else>
        <label for="pinterest-account">Compte Pinterest</label>
        <select id="pinterest-account" v-model="accountId">
          <option
            v-for="account in accounts"
            :key="account.id"
            :value="account.id"
          >
            {{ account.externalAccountName }} — {{ account.externalAccountId }}
          </option>
        </select>
        <label for="pinterest-board">Tableau Pinterest</label>
        <select id="pinterest-board" v-model="boardId" required>
          <option v-for="board in boards" :key="board.id" :value="board.id">
            {{ board.name }} — {{ board.privacy }}
          </option>
        </select>
        <label for="pinterest-title">Titre du Pin</label>
        <input
          id="pinterest-title"
          v-model="title"
          maxlength="100"
          required
          aria-describedby="pinterest-title-count"
        />
        <p id="pinterest-title-count">{{ title.length }}/100 caractères</p>
        <label for="pinterest-description">Description du Pin</label>
        <textarea
          id="pinterest-description"
          v-model="description"
          maxlength="800"
          required
          aria-describedby="pinterest-description-count"
        />
        <p id="pinterest-description-count">
          {{ description.length }}/800 caractères
        </p>
        <label for="pinterest-link">Lien de destination (facultatif)</label>
        <input id="pinterest-link" v-model="link" type="url" inputmode="url" />
        <label for="pinterest-run-at">Date et heure de publication</label>
        <input id="pinterest-run-at" v-model="runAt" type="datetime-local" />
        <div class="page-actions">
          <button
            type="button"
            :disabled="!isHydrated || isLoading"
            @click="validate"
          >
            Valider pour Pinterest
          </button>
          <button
            type="button"
            :disabled="
              !isHydrated ||
              isLoading ||
              !['approved', 'scheduled'].includes(status)
            "
            @click="program"
          >
            Programmer sur Pinterest
          </button>
        </div>
        <div v-if="validation" aria-live="polite">
          <p>
            {{
              validation.valid
                ? "Validation réussie."
                : "Validation impossible."
            }}
          </p>
          <ul v-if="validation.errors.length">
            <li v-for="message in validation.errors" :key="message">
              {{ message }}
            </li>
          </ul>
          <ul v-if="validation.warnings.length">
            <li v-for="message in validation.warnings" :key="message">
              {{ message }}
            </li>
          </ul>
        </div>
      </template>
    </div>

    <button
      v-if="canManage && schedule?.status === 'failed'"
      type="button"
      :disabled="!isHydrated || isLoading"
      @click="retry"
    >
      Relancer la publication Pinterest
    </button>

    <div v-if="schedule?.attempts.length" class="table-scroll" tabindex="0">
      <table>
        <caption>
          Historique des tentatives Pinterest
        </caption>
        <thead>
          <tr>
            <th scope="col">Tentative</th>
            <th scope="col">Début</th>
            <th scope="col">Résultat</th>
            <th scope="col">Code</th>
            <th scope="col">Identifiant distant</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attempt in schedule.attempts" :key="attempt.id">
            <th scope="row">{{ attempt.attempt }}</th>
            <td>
              <time :datetime="attempt.startedAt">{{
                new Date(attempt.startedAt).toLocaleString("fr-FR")
              }}</time>
            </td>
            <td>{{ attemptLabels[attempt.result] }}</td>
            <td>{{ attempt.normalizedError?.code ?? "—" }}</td>
            <td>{{ attempt.remotePostId ?? "—" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
