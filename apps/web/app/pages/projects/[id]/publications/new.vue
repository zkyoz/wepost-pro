<script setup lang="ts">
import type { ApiValidationError } from "~/types/auth";
import type { Project } from "~/types/project";
import type { PublicationInput } from "~/types/publication";

definePageMeta({
  middleware: ["auth", "role"],
  requiredRoles: ["admin", "agency"],
});
useHead({ title: "Créer une publication" });
const projectId = String(useRoute().params.id);
const project = (await useProjectsApi().get(projectId)).data as Project;
const errors = ref<ApiValidationError[]>([]);
const submitting = ref(false);

async function create(input: PublicationInput) {
  submitting.value = true;
  errors.value = [];
  try {
    const response = await usePublicationsApi().create(projectId, input);
    await navigateTo(`/publications/${response.data.id}`);
  } catch (error) {
    errors.value = getApiErrors(error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <PrivateShell
    ><main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li><NuxtLink to="/projects">Projets</NuxtLink></li>
          <li>
            <NuxtLink :to="`/projects/${project.id}`">{{
              project.name
            }}</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="`/projects/${project.id}/publications`"
              >Publications</NuxtLink
            >
          </li>
          <li aria-current="page">Création</li>
        </ol>
      </nav>
      <h1>Créer une publication</h1>
      <p
        v-if="!project.canAcceptPublications"
        class="error-summary"
        role="alert"
      >
        Réactivez le projet avant de créer une publication.
      </p>
      <PublicationForm
        v-else
        :default-timezone="project.timezone"
        :errors="errors"
        :submitting="submitting"
        @submit="create"
      /></main
  ></PrivateShell>
</template>
