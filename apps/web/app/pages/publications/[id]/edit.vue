<script setup lang="ts">
import type { ApiValidationError } from "~/types/auth";
import type { Publication, PublicationInput } from "~/types/publication";

definePageMeta({
  middleware: ["auth", "role"],
  requiredRoles: ["admin", "agency"],
});
useHead({ title: "Modifier une publication" });
const api = usePublicationsApi();
const publication = ref<Publication>(
  (await api.get(String(useRoute().params.id))).data,
);
const errors = ref<ApiValidationError[]>([]);
const submitting = ref(false);

async function update(input: PublicationInput) {
  submitting.value = true;
  errors.value = [];
  try {
    publication.value = (
      await api.update(
        publication.value.id,
        publication.value.contentVersion,
        input,
      )
    ).data;
    await navigateTo(`/publications/${publication.value.id}`);
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
          <li>
            <NuxtLink :to="`/projects/${publication.projectId}/publications`"
              >Publications</NuxtLink
            >
          </li>
          <li>
            <NuxtLink :to="`/publications/${publication.id}`">{{
              publication.title
            }}</NuxtLink>
          </li>
          <li aria-current="page">Modification</li>
        </ol>
      </nav>
      <h1>Modifier la publication</h1>
      <PublicationForm
        :publication="publication"
        :errors="errors"
        :submitting="submitting"
        @submit="update"
      /></main
  ></PrivateShell>
</template>
