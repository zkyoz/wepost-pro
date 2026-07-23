<script setup lang="ts">
import type { UserRole } from "~/types/auth";
import type {
  InstagramAccount,
  InstagramSchedule,
  InstagramValidation,
} from "~/types/instagram";
import { getApiErrors } from "~/utils/api-errors";

const props = defineProps<{
  publicationId: string;
  role: UserRole;
  status: string;
  scheduledAt: string | null;
}>();
const emit = defineEmits<{ scheduled: [] }>();
const api = useInstagramApi();
const canManage = computed(
  () => props.role === "admin" || props.role === "agency",
);
const accounts = ref<InstagramAccount[]>([]);
const accountId = ref("");
const runAt = ref(
  props.scheduledAt
    ? new Date(props.scheduledAt).toISOString().slice(0, 16)
    : "",
);
const schedule = ref<InstagramSchedule | null>(null);
const validation = ref<InstagramValidation | null>(null);
const isLoading = ref(false);
const isHydrated = ref(false);
const announcement = ref("");
const error = ref("");

onMounted(() => {
  isHydrated.value = true;
});

function errorText(cause: unknown) {
  return (
    getApiErrors(cause)[0]?.message ??
    (cause instanceof Error ? cause.message : "L’action Instagram a échoué.")
  );
}

const scheduleLabels: Record<InstagramSchedule["status"], string> = {
  queued: "En attente",
  publishing: "Publication en cours",
  published: "Publiée",
  failed: "Échec",
  cancelled: "Annulée",
};

const attemptLabels: Record<
  InstagramSchedule["attempts"][number]["result"],
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
  }
}

async function validate() {
  if (!accountId.value) return;
  error.value = "";
  isLoading.value = true;
  try {
    validation.value = (
      await api.validate(props.publicationId, accountId.value)
    ).data;
    announcement.value = validation.value.valid
      ? "La publication est compatible avec Instagram."
      : "La validation Instagram contient des erreurs.";
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
        accountId: accountId.value,
        runAt: runAt.value ? new Date(runAt.value).toISOString() : null,
      })
    ).data;
    announcement.value = "La publication Instagram est programmée.";
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
    announcement.value = "La relance Instagram est programmée.";
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
    aria-labelledby="instagram-publishing-title"
  >
    <h2 id="instagram-publishing-title">Publication Instagram</h2>
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
    <p v-else>Aucune programmation Instagram.</p>

    <div v-if="canManage && !schedule" class="instagram-controls">
      <p v-if="!accounts.length">
        Aucun compte Instagram connecté.
        <NuxtLink to="/settings/instagram"
          >Connecter un compte Instagram</NuxtLink
        >.
      </p>
      <template v-else>
        <label for="instagram-account">Compte Instagram professionnel</label>
        <select id="instagram-account" v-model="accountId">
          <option
            v-for="account in accounts"
            :key="account.id"
            :value="account.id"
          >
            {{ account.externalAccountName }} — {{ account.externalAccountId }}
          </option>
        </select>
        <label for="instagram-run-at">Date et heure de publication</label>
        <input id="instagram-run-at" v-model="runAt" type="datetime-local" />
        <div class="page-actions">
          <button
            type="button"
            :disabled="!isHydrated || isLoading"
            @click="validate"
          >
            Valider pour Instagram
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
            Programmer sur Instagram
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
      Relancer la publication Instagram
    </button>

    <div v-if="schedule?.attempts.length" class="table-scroll" tabindex="0">
      <table>
        <caption>
          Historique des tentatives Instagram
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
