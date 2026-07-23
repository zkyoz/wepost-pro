<script setup lang="ts">
import type { Project, ProjectListMeta, ProjectStatus } from "~/types/project";

definePageMeta({ middleware: "auth" });
useHead({ title: "Projets" });

const projectsApi = useProjectsApi();
const { user } = useAuth();
const projects = ref<Project[]>([]);
const meta = ref<ProjectListMeta>();
const q = ref("");
const status = ref<ProjectStatus | "">("");
const page = ref(1);
const loading = ref(false);
const announcement = ref("");
const canManage = computed(
  () => user.value?.role === "admin" || user.value?.role === "agency",
);

async function loadProjects() {
  loading.value = true;
  try {
    const response = await projectsApi.list({
      page: page.value,
      q: q.value || undefined,
      status: status.value,
    });
    projects.value = response.data;
    meta.value = response.meta;
    announcement.value = `${response.meta.total} projet${response.meta.total > 1 ? "s" : ""} trouvé${response.meta.total > 1 ? "s" : ""}.`;
  } finally {
    loading.value = false;
  }
}

async function search() {
  page.value = 1;
  await loadProjects();
}

async function changePage(nextPage: number) {
  page.value = nextPage;
  await loadProjects();
  document.querySelector<HTMLElement>("#projects-title")?.focus();
}

await loadProjects();
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li>Projets</li>
        </ol>
      </nav>
      <div class="page-heading">
        <div>
          <p class="auth-form__eyebrow">Portefeuille client</p>
          <h1 id="projects-title" tabindex="-1">Projets</h1>
        </div>
        <NuxtLink v-if="canManage" class="button-link" to="/projects/new"
          >Créer un projet</NuxtLink
        >
      </div>

      <dl v-if="meta" class="project-counters">
        <div>
          <dt>Actifs</dt>
          <dd>{{ meta.counts.active }}</dd>
        </div>
        <div>
          <dt>Archivés</dt>
          <dd>{{ meta.counts.archived }}</dd>
        </div>
      </dl>

      <form class="project-filters" role="search" @submit.prevent="search">
        <div class="form-field">
          <label for="project-search">Rechercher par nom</label>
          <input
            id="project-search"
            v-model="q"
            type="search"
            maxlength="120"
          />
        </div>
        <div class="form-field">
          <label for="project-status">État</label>
          <select id="project-status" v-model="status">
            <option value="">Tous</option>
            <option value="active">Actifs</option>
            <option value="archived">Archivés</option>
          </select>
        </div>
        <button type="submit">Filtrer</button>
      </form>

      <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>
      <p v-if="loading" role="status">Chargement des projets…</p>
      <section
        v-else-if="projects.length === 0"
        class="empty-state"
        aria-labelledby="empty-title"
      >
        <h2 id="empty-title">Aucun projet trouvé</h2>
        <p>Modifiez les filtres ou créez le premier projet.</p>
      </section>
      <ul v-else class="project-grid">
        <li v-for="project in projects" :key="project.id" class="project-card">
          <span class="status-badge" :class="`status-badge--${project.status}`">
            {{ project.status === "active" ? "Actif" : "Archivé" }}
          </span>
          <h2>
            <NuxtLink :to="`/projects/${project.id}`">{{
              project.name
            }}</NuxtLink>
          </h2>
          <p>{{ project.description || "Aucune description." }}</p>
          <small
            >{{ project.members.length }} membre{{
              project.members.length > 1 ? "s" : ""
            }}</small
          >
        </li>
      </ul>

      <nav
        v-if="meta && meta.lastPage > 1"
        class="pagination"
        aria-label="Pagination des projets"
      >
        <button
          type="button"
          :disabled="page <= 1"
          @click="changePage(page - 1)"
        >
          Précédent
        </button>
        <span>Page {{ page }} sur {{ meta.lastPage }}</span>
        <button
          type="button"
          :disabled="page >= meta.lastPage"
          @click="changePage(page + 1)"
        >
          Suivant
        </button>
      </nav>
    </main>
  </PrivateShell>
</template>
