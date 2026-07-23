<script setup lang="ts">
import type { Project } from "~/types/project";
import {
  PUBLICATION_STATUSES,
  PUBLICATION_STATUS_LABELS,
  SOCIAL_NETWORKS,
  type Publication,
  type PublicationStatus,
  type SocialNetwork,
} from "~/types/publication";

definePageMeta({ middleware: "auth" });
useHead({ title: "Publications" });
const route = useRoute();
const projectId = String(route.params.id);
const project = (await useProjectsApi().get(projectId)).data as Project;
const api = usePublicationsApi();
const { user } = useAuth();
const canManage = computed(
  () => user.value?.role === "admin" || user.value?.role === "agency",
);
const filters = reactive<{
  q: string;
  status: PublicationStatus | "";
  network: SocialNetwork | "";
  page: number;
}>({
  q: "",
  status: "",
  network: "",
  page: 1,
});
const publications = ref<Publication[]>([]);
const meta = ref({ currentPage: 1, lastPage: 1, total: 0 });

async function load() {
  const response = await api.list(projectId, filters);
  publications.value = response.data;
  meta.value = response.meta;
}
await load();
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li><NuxtLink to="/projects">Projets</NuxtLink></li>
          <li>
            <NuxtLink :to="`/projects/${project.id}`">{{
              project.name
            }}</NuxtLink>
          </li>
          <li aria-current="page">Publications</li>
        </ol>
      </nav>
      <div class="page-heading">
        <div>
          <p class="eyebrow">{{ project.name }}</p>
          <h1>Publications</h1>
        </div>
        <NuxtLink
          v-if="canManage && project.canAcceptPublications"
          class="button-link"
          :to="`/projects/${project.id}/publications/new`"
          >Créer une publication</NuxtLink
        >
      </div>

      <form
        class="filters"
        aria-label="Filtrer les publications"
        @submit.prevent="
          filters.page = 1;
          load();
        "
      >
        <label>Recherche <input v-model="filters.q" type="search" /></label>
        <label
          >Statut
          <select v-model="filters.status">
            <option value="">Tous</option>
            <option
              v-for="status in PUBLICATION_STATUSES"
              :key="status"
              :value="status"
            >
              {{ PUBLICATION_STATUS_LABELS[status] }}
            </option>
          </select></label
        >
        <label
          >Réseau
          <select v-model="filters.network">
            <option value="">Tous</option>
            <option
              v-for="network in SOCIAL_NETWORKS"
              :key="network"
              :value="network"
            >
              {{ network }}
            </option>
          </select></label
        >
        <button type="submit">Filtrer</button>
      </form>

      <p v-if="!publications.length" class="empty-state" role="status">
        Aucune publication ne correspond aux filtres.
      </p>
      <ul v-else class="publication-list">
        <li v-for="publication in publications" :key="publication.id">
          <NuxtLink :to="`/publications/${publication.id}`"
            ><strong>{{ publication.title }}</strong></NuxtLink
          >
          <span
            class="status-badge"
            :class="`status-badge--${publication.status}`"
            >{{ PUBLICATION_STATUS_LABELS[publication.status] }}</span
          >
          <span>{{ publication.targetNetworks.join(" · ") }}</span>
          <span>Version {{ publication.contentVersion }}</span>
        </li>
      </ul>
      <nav v-if="meta.lastPage > 1" class="pagination" aria-label="Pagination">
        <button
          :disabled="meta.currentPage <= 1"
          @click="
            filters.page--;
            load();
          "
        >
          Page précédente
        </button>
        <span>Page {{ meta.currentPage }} sur {{ meta.lastPage }}</span>
        <button
          :disabled="meta.currentPage >= meta.lastPage"
          @click="
            filters.page++;
            load();
          "
        >
          Page suivante
        </button>
      </nav>
    </main>
  </PrivateShell>
</template>
