<script setup lang="ts">
definePageMeta({ middleware: ["auth", "role"], requiredRoles: ["admin"] });
useHead({ title: "Administration globale" });

const overview = (await useAdminApi().overview()).data;
const sections = [
  { label: "Utilisateurs", value: overview.users.total, to: "/admin/users" },
  {
    label: "Projets",
    value: overview.projects.total,
    to: "/admin/resources?view=projects",
  },
  {
    label: "Publications",
    value: overview.publications.total,
    to: "/admin/resources?view=publications",
  },
  {
    label: "Comptes sociaux actifs",
    value: overview.socialAccounts.active,
    to: "/admin/resources?view=social-accounts",
  },
  {
    label: "Incidents",
    value: overview.incidents.total,
    to: "/admin/resources?view=incidents",
  },
  {
    label: "Journal d’audit",
    value: null,
    to: "/admin/resources?view=audit-logs",
  },
  {
    label: "État du système",
    value: null,
    to: "/admin/system",
  },
  {
    label: "Sauvegardes",
    value: null,
    to: "/admin/backups",
  },
];
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li>Administration</li>
        </ol>
      </nav>
      <h1>Administration globale</h1>
      <p class="dashboard__lead">
        Supervisez les ressources, les incidents et les actions sensibles sans
        exposer les secrets.
      </p>
      <dl class="project-counters" aria-label="Indicateurs d’administration">
        <div>
          <dt>Utilisateurs actifs</dt>
          <dd>{{ overview.users.active }}</dd>
        </div>
        <div>
          <dt>Projets archivés</dt>
          <dd>{{ overview.projects.archived }}</dd>
        </div>
        <div>
          <dt>Incidents</dt>
          <dd>{{ overview.incidents.total }}</dd>
        </div>
      </dl>
      <ul class="admin-section-list">
        <li v-for="section in sections" :key="section.to">
          <NuxtLink :to="section.to">
            <strong>{{ section.label }}</strong>
            <span v-if="section.value !== null"
              >{{ section.value }} élément(s)</span
            >
          </NuxtLink>
        </li>
      </ul>
    </main>
  </PrivateShell>
</template>
