<script setup lang="ts">
import type { UserRole } from "~/types/auth";
import type {
  TikTokAccount,
  TikTokSchedule,
  TikTokValidation,
} from "~/types/tiktok";
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
const api = useTikTokApi();
const canManage = computed(
  () => props.role === "admin" || props.role === "agency",
);
const accounts = ref<TikTokAccount[]>([]);
const accountId = ref("");
const privacyLevel = ref("");
const caption = ref(props.publicationText.slice(0, 2200));
const disableComment = ref(false);
const disableDuet = ref(false);
const disableStitch = ref(false);
const brandContentToggle = ref(false);
const brandOrganicToggle = ref(false);
const isAigc = ref(false);
const consent = ref(false);
const runAt = ref(
  props.scheduledAt
    ? new Date(props.scheduledAt).toISOString().slice(0, 16)
    : "",
);
const schedule = ref<TikTokSchedule | null>(null);
const validation = ref<TikTokValidation | null>(null);
const isLoading = ref(false);
const isHydrated = ref(false);
const announcement = ref("");
const error = ref("");
const selectedAccount = computed(() =>
  accounts.value.find((account) => account.id === accountId.value),
);

watch(selectedAccount, (account) => {
  if (!account) return;
  privacyLevel.value = account.creatorInfo.privacyLevelOptions[0] ?? "";
  disableComment.value ||= account.creatorInfo.commentDisabled;
  disableDuet.value ||= account.creatorInfo.duetDisabled;
  disableStitch.value ||= account.creatorInfo.stitchDisabled;
});
onMounted(() => {
  isHydrated.value = true;
});

function videoInput() {
  return {
    accountId: accountId.value,
    privacyLevel: privacyLevel.value,
    caption: caption.value,
    disableComment: disableComment.value,
    disableDuet: disableDuet.value,
    disableStitch: disableStitch.value,
    brandContentToggle: brandContentToggle.value,
    brandOrganicToggle: brandOrganicToggle.value,
    isAigc: isAigc.value,
  };
}
function errorText(cause: unknown) {
  return (
    getApiErrors(cause)[0]?.message ??
    (cause instanceof Error ? cause.message : "L’action TikTok a échoué.")
  );
}
const scheduleLabels: Record<TikTokSchedule["status"], string> = {
  queued: "En attente",
  publishing: "Traitement TikTok en cours",
  published: "Publiée",
  failed: "Échec",
  cancelled: "Annulée",
};
const attemptLabels: Record<
  TikTokSchedule["attempts"][number]["result"],
  string
> = {
  started: "En cours",
  success: "Réussie",
  transient_failure: "Échec temporaire",
  permanent_failure: "Échec définitif",
  skipped: "Déjà publiée",
};

async function load() {
  schedule.value = (await api.status(props.publicationId)).data;
  if (canManage.value) {
    accounts.value = (await api.accounts()).data.filter(
      (account) => account.status === "connected",
    );
    accountId.value = accounts.value[0]?.id ?? "";
  }
}
async function validate() {
  if (!accountId.value) return;
  error.value = "";
  isLoading.value = true;
  try {
    validation.value = (
      await api.validate(props.publicationId, videoInput())
    ).data;
    announcement.value = validation.value.valid
      ? "La vidéo est compatible avec TikTok."
      : "La validation TikTok contient des erreurs.";
  } catch (cause) {
    error.value = errorText(cause);
  } finally {
    isLoading.value = false;
  }
}
async function program() {
  if (!accountId.value || !consent.value) return;
  error.value = "";
  isLoading.value = true;
  try {
    schedule.value = (
      await api.schedule(props.publicationId, {
        ...videoInput(),
        runAt: runAt.value ? new Date(runAt.value).toISOString() : null,
      })
    ).data;
    announcement.value = "La publication TikTok est programmée.";
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
    announcement.value = "La relance TikTok est programmée.";
  } catch (cause) {
    error.value = errorText(cause);
  } finally {
    isLoading.value = false;
  }
}
await load();
</script>

<template>
  <section class="publication-detail" aria-labelledby="tiktok-publishing-title">
    <h2 id="tiktok-publishing-title">Publication TikTok</h2>
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
      <span v-if="schedule.providerStatus">
        Statut distant : {{ schedule.providerStatus }}.</span
      >
    </p>
    <p v-else>Aucune programmation TikTok.</p>

    <div v-if="canManage && !schedule" class="tiktok-controls">
      <p v-if="!accounts.length">
        Aucun compte TikTok connecté.
        <NuxtLink to="/settings/tiktok">Connecter un compte TikTok</NuxtLink>.
      </p>
      <template v-else>
        <label for="tiktok-account">Compte TikTok</label>
        <select id="tiktok-account" v-model="accountId">
          <option
            v-for="account in accounts"
            :key="account.id"
            :value="account.id"
          >
            {{ account.externalAccountName }}
          </option>
        </select>
        <label for="tiktok-privacy">Confidentialité</label>
        <select id="tiktok-privacy" v-model="privacyLevel" required>
          <option
            v-for="option in selectedAccount?.creatorInfo.privacyLevelOptions"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
        <label for="tiktok-caption">Légende</label>
        <textarea
          id="tiktok-caption"
          v-model="caption"
          maxlength="2200"
          aria-describedby="tiktok-caption-count"
        />
        <p id="tiktok-caption-count">{{ caption.length }}/2 200 caractères</p>
        <fieldset>
          <legend>Interactions et transparence</legend>
          <label
            ><input
              v-model="disableComment"
              type="checkbox"
              :disabled="selectedAccount?.creatorInfo.commentDisabled"
            />
            Désactiver les commentaires</label
          >
          <label
            ><input
              v-model="disableDuet"
              type="checkbox"
              :disabled="selectedAccount?.creatorInfo.duetDisabled"
            />
            Désactiver les Duos</label
          >
          <label
            ><input
              v-model="disableStitch"
              type="checkbox"
              :disabled="selectedAccount?.creatorInfo.stitchDisabled"
            />
            Désactiver les Collages</label
          >
          <label
            ><input v-model="brandContentToggle" type="checkbox" /> Contenu de
            marque</label
          >
          <label
            ><input v-model="brandOrganicToggle" type="checkbox" /> Contenu
            promotionnel personnel</label
          >
          <label
            ><input v-model="isAigc" type="checkbox" /> Contenu généré par
            IA</label
          >
        </fieldset>
        <label for="tiktok-run-at">Date et heure de publication</label>
        <input id="tiktok-run-at" v-model="runAt" type="datetime-local" />
        <label
          ><input v-model="consent" type="checkbox" required /> Je confirme le
          contenu, la confidentialité et l’envoi de cette vidéo à TikTok.</label
        >
        <div class="page-actions">
          <button
            type="button"
            :disabled="!isHydrated || isLoading"
            @click="validate"
          >
            Valider pour TikTok
          </button>
          <button
            type="button"
            :disabled="
              !isHydrated ||
              isLoading ||
              !consent ||
              !['approved', 'scheduled'].includes(status)
            "
            @click="program"
          >
            Programmer sur TikTok
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
      Relancer la publication TikTok
    </button>
    <div v-if="schedule?.attempts.length" class="table-scroll" tabindex="0">
      <table>
        <caption>
          Historique des tentatives TikTok
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
