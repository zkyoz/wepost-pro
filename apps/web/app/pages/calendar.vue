<script setup lang="ts">
import type {
  CalendarEvent,
  CalendarResponse,
  CalendarViewMode,
} from "~/types/calendar";
import {
  PUBLICATION_STATUSES,
  PUBLICATION_STATUS_LABELS,
  SOCIAL_NETWORKS,
  type PublicationStatus,
  type SocialNetwork,
} from "~/types/publication";
import {
  calendarDays,
  calendarRange,
  shiftCalendarAnchor,
  zonedDateKey,
} from "~/utils/calendar";
import { getApiErrors, getStatusCode } from "~/utils/api-errors";

definePageMeta({ middleware: "auth" });
useHead({ title: "Calendrier éditorial" });

const api = useCalendarApi();
const { user } = useAuth();
const view = ref<CalendarViewMode>("month");
const displayTimezone = ref(
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris",
);
const anchor = ref(
  zonedDateKey(new Date().toISOString(), displayTimezone.value),
);
const result = ref<CalendarResponse>();
const events = computed(() => result.value?.data ?? []);
const projectId = ref("");
const clientId = ref("");
const network = ref<SocialNetwork | "">("");
const status = ref<PublicationStatus | "">("");
const includeUndated = ref(true);
const page = ref(1);
const loading = ref(false);
const announcement = ref("");
const errorMessage = ref("");
const canManage = computed(
  () => user.value?.role === "admin" || user.value?.role === "agency",
);
const range = computed(() => calendarRange(anchor.value, view.value));
const days = computed(() => calendarDays(anchor.value, view.value));
const datedEvents = computed(() =>
  events.value.filter((event) => event.scheduledAt),
);
const undatedEvents = computed(() =>
  events.value.filter((event) => !event.scheduledAt),
);
const timezoneOptions = computed(() => [
  ...new Set([
    displayTimezone.value,
    "UTC",
    "Europe/Paris",
    ...(result.value?.filters.projects.map((project) => project.timezone) ??
      []),
  ]),
]);

function errorText(error: unknown) {
  return (
    getApiErrors(error)[0]?.message ??
    "Le calendrier est temporairement indisponible."
  );
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    result.value = await api.list({
      ...range.value,
      timezone: displayTimezone.value,
      projectId: projectId.value || undefined,
      clientId: clientId.value || undefined,
      network: network.value,
      status: status.value,
      includeUndated: includeUndated.value,
      page: page.value,
      perPage: 100,
    });
    announcement.value = `${result.value.meta.total} publication${result.value.meta.total > 1 ? "s" : ""} dans le calendrier.`;
  } catch (error) {
    errorMessage.value = errorText(error);
  } finally {
    loading.value = false;
  }
}

async function applyFilters() {
  page.value = 1;
  await load();
}

async function selectView(next: CalendarViewMode) {
  view.value = next;
  page.value = 1;
  await load();
}

async function shift(direction: -1 | 1) {
  anchor.value = shiftCalendarAnchor(anchor.value, view.value, direction);
  page.value = 1;
  await load();
  document.querySelector<HTMLElement>("#calendar-title")?.focus();
}

async function today() {
  anchor.value = zonedDateKey(new Date().toISOString(), displayTimezone.value);
  await load();
}

async function changePage(nextPage: number) {
  page.value = nextPage;
  await load();
  document.querySelector<HTMLElement>("#calendar-list-title")?.focus();
}

function eventsForDay(day: string) {
  return datedEvents.value.filter(
    (event) => zonedDateKey(event.scheduledAt!, displayTimezone.value) === day,
  );
}

async function move(input: {
  event: CalendarEvent;
  scheduledAt: string;
  timezone: string;
}) {
  errorMessage.value = "";
  try {
    await api.move(input.event.id, {
      contentVersion: input.event.contentVersion,
      scheduledAt: input.scheduledAt,
      timezone: input.timezone,
    });
    await load();
    announcement.value = `${input.event.title} a été déplacée.`;
  } catch (error) {
    if (getStatusCode(error) === 409) {
      await load();
      errorMessage.value =
        "La publication a changé ailleurs. Le calendrier a été actualisé.";
    } else {
      errorMessage.value = errorText(error);
    }
  }
}

onMounted(load);
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li aria-current="page">Calendrier</li>
        </ol>
      </nav>
      <div class="page-heading">
        <div>
          <p class="auth-form__eyebrow">Planning social</p>
          <h1 id="calendar-title" tabindex="-1">Calendrier éditorial</h1>
        </div>
      </div>

      <div class="calendar-toolbar" aria-label="Choix de la vue">
        <button
          v-for="mode in ['month', 'week', 'list'] as CalendarViewMode[]"
          :key="mode"
          type="button"
          :aria-pressed="view === mode"
          @click="selectView(mode)"
        >
          {{
            mode === "month" ? "Mois" : mode === "week" ? "Semaine" : "Liste"
          }}
        </button>
      </div>

      <form
        class="calendar-filters"
        aria-label="Filtres du calendrier"
        @submit.prevent="applyFilters"
      >
        <div class="form-field">
          <label for="calendar-project">Projet</label>
          <select id="calendar-project" v-model="projectId">
            <option value="">Tous les projets</option>
            <option
              v-for="project in result?.filters.projects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label for="calendar-client">Client</label>
          <select id="calendar-client" v-model="clientId">
            <option value="">Tous les clients</option>
            <option
              v-for="client in result?.filters.clients"
              :key="client.id"
              :value="client.id"
            >
              {{ client.name }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label for="calendar-network">Réseau</label>
          <select id="calendar-network" v-model="network">
            <option value="">Tous les réseaux</option>
            <option v-for="item in SOCIAL_NETWORKS" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label for="calendar-status">Statut</label>
          <select id="calendar-status" v-model="status">
            <option value="">Tous les statuts</option>
            <option
              v-for="item in PUBLICATION_STATUSES"
              :key="item"
              :value="item"
            >
              {{ PUBLICATION_STATUS_LABELS[item] }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label for="calendar-timezone">Fuseau d’affichage</label>
          <select id="calendar-timezone" v-model="displayTimezone">
            <option v-for="item in timezoneOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>
        <label class="check-control">
          <input v-model="includeUndated" type="checkbox" />
          Afficher les publications sans date
        </label>
        <button type="submit">Appliquer les filtres</button>
      </form>

      <CalendarExportPanel
        v-if="canManage && result"
        :projects="result.filters.projects"
        :range-start="range.start"
        :range-end="range.end"
        :timezone="displayTimezone"
        :selected-project-id="projectId"
      />

      <div class="calendar-period">
        <button type="button" @click="shift(-1)">Période précédente</button>
        <button type="button" @click="today">Aujourd’hui</button>
        <button type="button" @click="shift(1)">Période suivante</button>
      </div>

      <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>
      <p v-if="errorMessage" class="error-summary" role="alert">
        {{ errorMessage }}
      </p>
      <p v-if="loading" role="status">Chargement du calendrier…</p>

      <section
        v-else-if="view !== 'list'"
        :aria-label="view === 'month' ? 'Vue mensuelle' : 'Vue hebdomadaire'"
      >
        <div class="calendar-grid" :class="`calendar-grid--${view}`">
          <section v-for="day in days" :key="day" class="calendar-day">
            <h2>
              <time :datetime="day">{{
                new Date(`${day}T12:00:00Z`).toLocaleDateString("fr-FR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                })
              }}</time>
            </h2>
            <p
              v-if="eventsForDay(day).length === 0"
              class="calendar-day__empty"
            >
              Aucune publication
            </p>
            <CalendarEventCard
              v-for="event in eventsForDay(day)"
              :key="event.id"
              :event="event"
              :display-timezone="displayTimezone"
              :can-manage="canManage"
              @move="move"
            />
          </section>
        </div>
      </section>

      <section v-else aria-labelledby="calendar-list-title">
        <h2 id="calendar-list-title" tabindex="-1">
          Liste chronologique accessible
        </h2>
        <p v-if="events.length === 0" class="empty-state">
          Aucune publication pour ces filtres.
        </p>
        <ol v-else class="calendar-list">
          <li v-for="event in events" :key="event.id">
            <CalendarEventCard
              :event="event"
              :display-timezone="displayTimezone"
              :can-manage="canManage"
              @move="move"
            />
          </li>
        </ol>
        <nav
          v-if="result && result.meta.lastPage > 1"
          class="pagination"
          aria-label="Pagination du calendrier"
        >
          <button
            type="button"
            :disabled="page <= 1"
            @click="changePage(page - 1)"
          >
            Précédent
          </button>
          <span>Page {{ page }} sur {{ result.meta.lastPage }}</span>
          <button
            type="button"
            :disabled="page >= result.meta.lastPage"
            @click="changePage(page + 1)"
          >
            Suivant
          </button>
        </nav>
      </section>

      <section
        v-if="view !== 'list' && undatedEvents.length"
        aria-labelledby="undated-title"
      >
        <h2 id="undated-title">Publications sans date</h2>
        <ul class="calendar-list">
          <li v-for="event in undatedEvents" :key="event.id">
            <CalendarEventCard
              :event="event"
              :display-timezone="displayTimezone"
              :can-manage="canManage"
              @move="move"
            />
          </li>
        </ul>
      </section>

      <p
        v-if="result && result.meta.total > result.data.length"
        class="status-message"
      >
        {{ result.data.length }} résultats affichés sur {{ result.meta.total }}.
        Utilisez la vue liste et les filtres pour réduire la période.
      </p>
    </main>
  </PrivateShell>
</template>
