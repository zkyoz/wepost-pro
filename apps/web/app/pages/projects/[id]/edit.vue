<script setup lang="ts">
import type { ApiValidationError } from "~/types/auth";
import type { Project, ProjectClient, ProjectInput } from "~/types/project";

definePageMeta({
  middleware: ["auth", "role"],
  requiredRoles: ["admin", "agency"],
});

const route = useRoute();
const projectsApi = useProjectsApi();
const project = ref<Project>(
  (await projectsApi.get(String(route.params.id))).data,
);
const clients = ref<ProjectClient[]>((await projectsApi.clients()).data);
const errors = ref<ApiValidationError[]>([]);
const submitting = ref(false);
useHead(() => ({ title: `Modifier ${project.value.name}` }));

if (project.value.status === "archived")
  await navigateTo(`/projects/${project.value.id}`);

async function updateProject(input: ProjectInput) {
  submitting.value = true;
  errors.value = [];
  try {
    await projectsApi.update(project.value.id, input);
    await navigateTo(`/projects/${project.value.id}`);
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
          <li>
            <NuxtLink :to="`/projects/${project.id}`">{{
              project.name
            }}</NuxtLink>
          </li>
          <li aria-current="page">Modification</li>
        </ol>
      </nav>
      <h1>Modifier le projet</h1>
      <ProjectForm
        :clients="clients"
        :project="project"
        :errors="errors"
        :submitting="submitting"
        @submit="updateProject"
      />
    </main>
  </PrivateShell>
</template>
