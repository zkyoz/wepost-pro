<script setup lang="ts">
import type { ApiValidationError } from "~/types/auth";
import type { ProjectClient, ProjectInput } from "~/types/project";

definePageMeta({
  middleware: ["auth", "role"],
  requiredRoles: ["admin", "agency"],
});
useHead({ title: "Créer un projet" });

const projectsApi = useProjectsApi();
const clients = ref<ProjectClient[]>([]);
const errors = ref<ApiValidationError[]>([]);
const submitting = ref(false);

clients.value = (await projectsApi.clients()).data;

async function createProject(input: ProjectInput) {
  submitting.value = true;
  errors.value = [];
  try {
    const response = await projectsApi.create(input);
    await navigateTo(`/projects/${response.data.id}`);
  } catch (error) {
    errors.value = getApiErrors(error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li><NuxtLink to="/projects">Projets</NuxtLink></li>
          <li aria-current="page">Création</li>
        </ol>
      </nav>
      <h1>Créer un projet</h1>
      <p v-if="clients.length === 0" class="empty-state" role="status">
        Créez d’abord un compte client actif dans la même agence.
      </p>
      <ProjectForm
        :clients="clients"
        :errors="errors"
        :submitting="submitting"
        @submit="createProject"
      />
    </main>
  </PrivateShell>
</template>
