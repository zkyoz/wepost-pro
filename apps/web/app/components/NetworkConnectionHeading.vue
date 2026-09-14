<script setup lang="ts">
defineProps<{ name: string; icon: string; count: number }>();
</script>
<template>
  <div class="page-heading network-heading">
    <div class="network-heading__identity">
      <span class="network-heading__icon"
        ><AppIcon :name="icon" :size="28"
      /></span>
      <div>
        <p class="eyebrow">Réseaux sociaux</p>
        <h1>Connexion {{ name }}</h1>
        <p class="dashboard__lead">
          Gérez les comptes et les autorisations de publication.
        </p>
      </div>
    </div>
    <UBadge color="neutral" variant="subtle" class="network-connection-count"
      >{{ count }} compte{{ count > 1 ? "s" : "" }} connecté{{
        count > 1 ? "s" : ""
      }}</UBadge
    >
  </div>
</template>
