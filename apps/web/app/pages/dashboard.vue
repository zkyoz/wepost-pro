<script setup lang="ts">
import type { CalendarEvent } from "~/types/calendar";
import type { Project, ProjectListMeta } from "~/types/project";
import { PUBLICATION_STATUS_LABELS } from "~/types/publication";
import type { SupervisionSummary } from "~/types/supervision";
import { addCalendarDays, dateKey } from "~/utils/calendar";

definePageMeta({ middleware: "auth" });
const { t, locale } = useLocale();
useHead(() => ({ title: t("dashboard.title") }));

const { user } = useAuth();
const projectsApi = useProjectsApi();
const calendarApi = useCalendarApi();
const supervisionApi = useSupervisionApi();

const projects = ref<Project[]>([]);
const projectMeta = ref<ProjectListMeta | null>(null);
const upcomingEvents = ref<CalendarEvent[]>([]);
const supervision = ref<SupervisionSummary | null>(null);
const loading = ref(true);
const dashboardError = ref("");

const canManage = computed(
  () => user.value?.role === "admin" || user.value?.role === "agency",
);
const firstName = computed(
  () => user.value?.displayName.trim().split(/\s+/)[0] || "vous",
);

const attentionCards = computed(() => {
  const counts = supervision.value?.counts;
  const localCount = (status: CalendarEvent["status"]) =>
    upcomingEvents.value.filter((event) => event.status === status).length;

  return [
    {
      label: t("dashboard.awaitingReview"),
      detail: t("dashboard.awaitingReviewDetail"),
      count:
        counts?.awaiting_client_review ?? localCount("awaiting_client_review"),
      icon: "check",
      tone: "orange",
      category: "awaiting_client_review",
    },
    {
      label: t("dashboard.changesRequested"),
      detail: t("dashboard.changesRequestedDetail"),
      count: counts?.changes_requested ?? localCount("changes_requested"),
      icon: "message",
      tone: "amber",
      category: "changes_requested",
    },
    {
      label: t("dashboard.scheduled"),
      detail: t("dashboard.scheduledDetail"),
      count: counts?.scheduled ?? localCount("scheduled"),
      icon: "calendar",
      tone: "blue",
      category: "scheduled",
    },
    {
      label: t("dashboard.failed"),
      detail: t("dashboard.failedDetail"),
      count: counts?.failed ?? localCount("failed"),
      icon: "alert",
      tone: "danger",
      category: "failed",
    },
  ];
});

async function loadDashboard() {
  loading.value = true;
  dashboardError.value = "";
  let successfulRequests = 0;

  try {
    const response = await projectsApi.list({ page: 1, status: "active" });
    projects.value = response.data.slice(0, 5);
    projectMeta.value = response.meta;
    successfulRequests += 1;
  } catch {
    projects.value = [];
  }

  const today = dateKey(new Date());
  try {
    const response = await calendarApi.list({
      start: `${today}T00:00`,
      end: `${addCalendarDays(today, 14)}T23:59`,
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris",
      includeUndated: false,
      page: 1,
      perPage: 100,
    });
    upcomingEvents.value = response.data
      .filter((event) => event.scheduledAt)
      .sort(
        (left, right) =>
          new Date(left.scheduledAt!).getTime() -
          new Date(right.scheduledAt!).getTime(),
      )
      .slice(0, 6);
    successfulRequests += 1;
  } catch {
    upcomingEvents.value = [];
  }

  if (canManage.value) {
    try {
      const response = await supervisionApi.summary();
      supervision.value = response.data;
      successfulRequests += 1;
    } catch {
      supervision.value = null;
    }
  }

  if (!successfulRequests) {
    dashboardError.value = t("dashboard.unavailable");
  }
  loading.value = false;
}

function eventDate(value: string | null) {
  if (!value) return "Date à définir";
  return new Intl.DateTimeFormat(locale.value === "en" ? "en-GB" : "fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

await loadDashboard();
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard dashboard-overview" tabindex="-1">
      <header class="dashboard-overview__header">
        <div>
          <h1>{{ t("dashboard.greeting", { name: firstName }) }}</h1>
          <p class="dashboard__lead">
            {{ t("dashboard.attentionLead") }}
          </p>
        </div>
        <div class="dashboard-overview__actions">
          <NuxtLink
            class="dashboard-action dashboard-action--secondary"
            to="/calendar"
          >
            <AppIcon name="calendar" :size="19" />
            {{ t("dashboard.viewCalendar") }}
          </NuxtLink>
          <NuxtLink
            v-if="canManage"
            class="dashboard-action dashboard-action--primary"
            to="/projects"
          >
            <AppIcon name="plus" :size="19" />
            {{ t("dashboard.createPublication") }}
          </NuxtLink>
        </div>
      </header>

      <p v-if="dashboardError" class="error-summary" role="alert">
        {{ dashboardError }}
      </p>
      <p v-if="loading" class="dashboard-loading" role="status">
        {{ t("dashboard.loading") }}
      </p>

      <section aria-labelledby="attention-title">
        <div class="dashboard-section-heading">
          <h2 id="attention-title">{{ t("dashboard.toHandle") }}</h2>
          <span v-if="projectMeta">{{
            t(
              projectMeta.counts.active > 1
                ? "dashboard.activeProjects"
                : "dashboard.activeProject",
              { count: projectMeta.counts.active },
            )
          }}</span>
        </div>
        <div class="attention-grid">
          <NuxtLink
            v-for="card in attentionCards"
            :key="card.category"
            :to="
              canManage ? `/supervision?category=${card.category}` : '/calendar'
            "
            class="attention-card"
            :class="`attention-card--${card.tone}`"
          >
            <span class="attention-card__icon">
              <AppIcon :name="card.icon" :size="23" />
            </span>
            <span class="attention-card__content">
              <strong>{{ card.count }}</strong>
              <span>{{ card.label }}</span>
              <small>{{ card.detail }}</small>
            </span>
            <AppIcon name="arrow" :size="18" />
          </NuxtLink>
        </div>
      </section>

      <div class="dashboard-workspace">
        <section
          class="dashboard-panel dashboard-agenda"
          aria-labelledby="agenda-title"
        >
          <header class="dashboard-panel__header">
            <div>
              <AppIcon name="calendar" :size="20" />
              <h2 id="agenda-title">{{ t("dashboard.editorialCalendar") }}</h2>
            </div>
            <NuxtLink to="/calendar">{{
              t("dashboard.openCalendar")
            }}</NuxtLink>
          </header>
          <ol v-if="upcomingEvents.length" class="dashboard-agenda__list">
            <li v-for="event in upcomingEvents" :key="event.id">
              <time :datetime="event.scheduledAt ?? undefined">
                {{ eventDate(event.scheduledAt) }}
              </time>
              <div>
                <strong>{{ event.title }}</strong>
                <span>{{ event.projectName }}</span>
              </div>
              <span
                class="dashboard-status"
                :class="`dashboard-status--${event.status}`"
              >
                {{ PUBLICATION_STATUS_LABELS[event.status] }}
              </span>
            </li>
          </ol>
          <div v-else class="dashboard-empty">
            <AppIcon name="calendar" :size="30" />
            <h3>{{ t("dashboard.noUpcoming") }}</h3>
            <p>{{ t("dashboard.noUpcomingDetail") }}</p>
          </div>
        </section>

        <section
          class="dashboard-panel dashboard-projects"
          aria-labelledby="recent-projects-title"
        >
          <header class="dashboard-panel__header">
            <div>
              <AppIcon name="folder" :size="20" />
              <h2 id="recent-projects-title">
                {{ t("dashboard.recentProjects") }}
              </h2>
            </div>
            <NuxtLink to="/projects">{{ t("dashboard.allProjects") }}</NuxtLink>
          </header>
          <ul v-if="projects.length" class="dashboard-projects__list">
            <li v-for="project in projects" :key="project.id">
              <span class="dashboard-projects__avatar" aria-hidden="true">
                {{ project.name.slice(0, 1).toUpperCase() }}
              </span>
              <div>
                <NuxtLink :to="`/projects/${project.id}`">
                  {{ project.name }}
                </NuxtLink>
                <small>
                  {{
                    t(
                      project.members.length > 1
                        ? "dashboard.members"
                        : "dashboard.member",
                      { count: project.members.length },
                    )
                  }}
                </small>
              </div>
              <span class="dashboard-status dashboard-status--active">
                {{ t("dashboard.active") }}
              </span>
            </li>
          </ul>
          <div v-else class="dashboard-empty">
            <AppIcon name="folder" :size="30" />
            <h3>{{ t("dashboard.noActiveProject") }}</h3>
            <p>
              {{
                canManage
                  ? t("dashboard.noActiveProjectManage")
                  : t("dashboard.noActiveProjectClient")
              }}
            </p>
          </div>
        </section>
      </div>

      <section class="dashboard-session" aria-labelledby="session-title">
        <span><AppIcon name="shield" :size="21" /></span>
        <div>
          <h2 id="session-title">{{ t("dashboard.sessionTitle") }}</h2>
          <p>{{ user?.email }} · {{ t(`roles.${user?.role ?? "client"}`) }}</p>
        </div>
      </section>
    </main>
  </PrivateShell>
</template>
