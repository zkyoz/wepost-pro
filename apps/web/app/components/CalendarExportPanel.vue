<script setup lang="ts">
import type { CalendarFeed } from "~/types/calendar-feed";
import { getApiErrors } from "~/utils/api-errors";

const props = defineProps<{
  projects: Array<{ id: string; name: string }>;
  rangeStart: string;
  rangeEnd: string;
  timezone: string;
  selectedProjectId: string;
}>();

const api = useCalendarFeedApi();
const config = useRuntimeConfig();
const start = ref(props.rangeStart.slice(0, 10));
const end = ref(previousDay(props.rangeEnd.slice(0, 10)));
const exportProjectId = ref(props.selectedProjectId);
const feedProjectId = ref(props.selectedProjectId);
const feeds = ref<CalendarFeed[]>([]);
const createdFeed = ref<{ id: string; url: string } | null>(null);
const loading = ref(false);
const announcement = ref("");
const error = ref("");

watch(
  () => props.selectedProjectId,
  (projectId) => {
    exportProjectId.value = projectId;
    feedProjectId.value = projectId;
  },
);
watch(
  () => [props.rangeStart, props.rangeEnd] as const,
  ([from, to]) => {
    start.value = from.slice(0, 10);
    end.value = previousDay(to.slice(0, 10));
  },
);

function previousDay(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function nextDay(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function errorMessage(exception: unknown) {
  return (
    getApiErrors(exception)[0]?.message ??
    "L’opération calendrier n’a pas pu être réalisée."
  );
}

async function loadFeeds() {
  try {
    feeds.value = (await api.list()).data;
  } catch (exception) {
    error.value = errorMessage(exception);
  }
}

async function download() {
  loading.value = true;
  error.value = "";
  try {
    const blob = await api.download({
      start: `${start.value}T00:00`,
      end: `${nextDay(end.value)}T00:00`,
      timezone: props.timezone,
      projectId: exportProjectId.value || undefined,
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wepost-calendrier-${end.value}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    announcement.value = "Le fichier ICS est téléchargé.";
  } catch (exception) {
    error.value = errorMessage(exception);
  } finally {
    loading.value = false;
  }
}

async function createFeed() {
  loading.value = true;
  error.value = "";
  try {
    const result = await api.create(feedProjectId.value || undefined);
    feeds.value = [result.data, ...feeds.value];
    createdFeed.value = {
      id: result.data.id,
      url: absoluteCalendarFeedUrl(
        result.feedPath,
        String(config.public.apiBase),
      ),
    };
    announcement.value =
      "Le lien d’abonnement est créé. Copiez-le maintenant : il ne sera plus affiché après rechargement.";
  } catch (exception) {
    error.value = errorMessage(exception);
  } finally {
    loading.value = false;
  }
}

async function copyFeedUrl() {
  if (!createdFeed.value) return;
  try {
    await navigator.clipboard.writeText(createdFeed.value.url);
    announcement.value = "Le lien d’abonnement a été copié.";
  } catch {
    error.value =
      "La copie automatique est indisponible. Sélectionnez puis copiez le lien.";
  }
}

async function revoke(feed: CalendarFeed) {
  if (!window.confirm("Révoquer ce lien d’abonnement ?")) return;
  loading.value = true;
  error.value = "";
  try {
    await api.revoke(feed.id);
    const revokedAt = new Date().toISOString();
    feeds.value = feeds.value.map((item) =>
      item.id === feed.id ? { ...item, revokedAt } : item,
    );
    if (createdFeed.value?.id === feed.id) createdFeed.value = null;
    announcement.value = "Le lien d’abonnement est révoqué.";
  } catch (exception) {
    error.value = errorMessage(exception);
  } finally {
    loading.value = false;
  }
}

onMounted(loadFeeds);
</script>

<template>
  <section class="calendar-export" aria-labelledby="calendar-export-title">
    <div class="calendar-export__heading">
      <div>
        <h2 id="calendar-export-title">Exporter ou s’abonner</h2>
        <p>
          Le fichier contient le titre, le projet, le statut et la date. Les
          commentaires et textes privés sont exclus.
        </p>
      </div>
      <p class="calendar-export__format">Format iCalendar (.ics)</p>
    </div>

    <p class="status-message" role="status" aria-live="polite">
      {{ announcement }}
    </p>
    <p v-if="error" class="error-summary" role="alert">{{ error }}</p>

    <div class="calendar-export__columns">
      <form class="calendar-export__form" @submit.prevent="download">
        <h3>Téléchargement ponctuel</h3>
        <label>
          Du
          <input v-model="start" type="date" required />
        </label>
        <label>
          Au
          <input v-model="end" type="date" required />
        </label>
        <label>
          Projet à télécharger
          <select v-model="exportProjectId">
            <option value="">Tous les projets accessibles</option>
            <option
              v-for="project in projects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </label>
        <p class="form-hint">Fuseau sélectionné : {{ timezone }}</p>
        <button type="submit" :disabled="loading">
          Télécharger le fichier ICS
        </button>
      </form>

      <div class="calendar-export__subscription">
        <h3>Abonnement automatique</h3>
        <p>
          Toute personne possédant le lien peut lire ce calendrier. Révoquez
          immédiatement un lien partagé par erreur.
        </p>
        <label>
          Projet du flux
          <select v-model="feedProjectId">
            <option value="">Tous les projets accessibles</option>
            <option
              v-for="project in projects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </label>
        <button type="button" :disabled="loading" @click="createFeed">
          Créer un lien d’abonnement
        </button>
        <div v-if="createdFeed" class="calendar-export__created">
          <label for="calendar-created-feed"
            >Lien créé — affiché une seule fois</label
          >
          <input
            id="calendar-created-feed"
            :value="createdFeed.url"
            readonly
            @focus="($event.target as HTMLInputElement).select()"
          />
          <button type="button" @click="copyFeedUrl">
            Copier le lien d’abonnement
          </button>
        </div>
      </div>
    </div>

    <section aria-labelledby="active-feeds-title">
      <h3 id="active-feeds-title">Liens créés</h3>
      <p v-if="feeds.length === 0" class="empty-state">
        Aucun lien d’abonnement.
      </p>
      <ul v-else class="calendar-feed-list">
        <li v-for="feed in feeds" :key="feed.id">
          <span>
            <strong>{{ feed.projectName || "Tous les projets" }}</strong>
            — créé le {{ new Date(feed.createdAt).toLocaleDateString("fr-FR") }}
            <template v-if="feed.lastUsedAt">
              — dernier accès
              {{ new Date(feed.lastUsedAt).toLocaleDateString("fr-FR") }}
            </template>
            — {{ feed.revokedAt ? "Révoqué" : "Actif" }}
          </span>
          <button
            v-if="!feed.revokedAt"
            type="button"
            :disabled="loading"
            :aria-label="`Révoquer le lien pour ${feed.projectName || 'tous les projets'}`"
            @click="revoke(feed)"
          >
            Révoquer
          </button>
        </li>
      </ul>
    </section>

    <details class="calendar-export__instructions">
      <summary>Instructions d’import et d’abonnement</summary>
      <ol>
        <li>
          Google Calendar sur ordinateur : « Autres agendas », « Ajouter », puis
          « À partir de l’URL ».
        </li>
        <li>
          Outlook web : « Ajouter un calendrier », puis « S’abonner à partir du
          web ».
        </li>
        <li>
          Calendrier Apple sur Mac : « Fichier », puis « Nouvel abonnement à un
          calendrier ».
        </li>
      </ol>
      <p>
        Un fichier téléchargé est un instantané. Seul le lien d’abonnement
        reçoit les mises à jour et annulations ultérieures.
      </p>
    </details>
  </section>
</template>
