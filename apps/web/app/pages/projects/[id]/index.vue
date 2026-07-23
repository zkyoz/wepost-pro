<script setup lang="ts">
import type { Project } from "~/types/project";

definePageMeta({ middleware: "auth" });

const route = useRoute();
const projectsApi = useProjectsApi();
const { user } = useAuth();
const project = ref<Project>(
  (await projectsApi.get(String(route.params.id))).data,
);
const archiveDialog = ref<{ open: () => void }>();
const announcement = ref("");
const canManage = computed(
  () => user.value?.role === "admin" || user.value?.role === "agency",
);
useHead(() => ({ title: project.value.name }));

async function archive() {
  project.value = (await projectsApi.archive(project.value.id)).data;
  announcement.value = "Le projet a été archivé.";
}

async function restore() {
  project.value = (await projectsApi.restore(project.value.id)).data;
  announcement.value = "Le projet a été réactivé.";
}
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li><NuxtLink to="/projects">Projets</NuxtLink></li>
          <li aria-current="page">{{ project.name }}</li>
        </ol>
      </nav>
      <div class="page-heading">
        <div>
          <span
            class="status-badge"
            :class="`status-badge--${project.status}`"
            >{{ project.status === "active" ? "Actif" : "Archivé" }}</span
          >
          <h1>{{ project.name }}</h1>
        </div>
        <div v-if="canManage" class="page-actions">
          <NuxtLink
            v-if="project.status === 'active'"
            class="button-link"
            :to="`/projects/${project.id}/edit`"
            >Modifier</NuxtLink
          >
          <button
            v-if="project.status === 'active'"
            type="button"
            @click="archiveDialog?.open()"
          >
            Archiver
          </button>
          <button v-else type="button" @click="restore">Réactiver</button>
        </div>
      </div>
      <p>
        <NuxtLink
          class="button-link"
          :to="`/projects/${project.id}/publications`"
        >
          Voir les publications
        </NuxtLink>
      </p>
      <p class="status-message" role="status" aria-live="polite">
        {{ announcement }}
      </p>

      <section class="project-detail" aria-labelledby="project-information">
        <h2 id="project-information">Informations</h2>
        <p>{{ project.description || "Aucune description." }}</p>
        <dl>
          <div>
            <dt>Fuseau horaire</dt>
            <dd>{{ project.timezone }}</dd>
          </div>
          <div>
            <dt>Nouvelles publications</dt>
            <dd>
              {{ project.canAcceptPublications ? "Autorisées" : "Suspendues" }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="project-detail" aria-labelledby="project-members">
        <h2 id="project-members">Clients affectés</h2>
        <ul>
          <li v-for="member in project.members" :key="member.id">
            {{ member.displayName }} — {{ member.email }}
          </li>
        </ul>
      </section>

      <section
        v-if="project.history?.length"
        class="project-detail"
        aria-labelledby="project-history"
      >
        <h2 id="project-history">Historique</h2>
        <ol>
          <li
            v-for="entry in project.history"
            :key="`${entry.action}-${entry.createdAt}`"
          >
            {{ entry.action }} —
            <time :datetime="entry.createdAt">{{
              new Date(entry.createdAt).toLocaleString("fr-FR")
            }}</time>
          </li>
        </ol>
      </section>

      <ProjectArchiveDialog
        ref="archiveDialog"
        :project-name="project.name"
        @confirm="archive"
      />
    </main>
  </PrivateShell>
</template>
