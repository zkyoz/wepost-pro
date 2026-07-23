<script setup lang="ts">
import {
  PUBLICATION_STATUS_LABELS,
  SOCIAL_NETWORKS,
} from "~/types/publication";
import type { StatisticsFilters, StatisticsResult } from "~/types/statistics";

definePageMeta({
  middleware: ["auth", "role"],
  requiredRoles: ["admin", "agency"],
});
useHead({ title: "Statistiques agence" });

const route = useRoute();
const router = useRouter();
const api = useStatisticsApi();

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function routeValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

const today = new Date();
const monthAgo = new Date(today);
monthAgo.setUTCDate(monthAgo.getUTCDate() - 29);

const filters = reactive<StatisticsFilters>({
  from: routeValue(route.query.from) || isoDate(monthAgo),
  to: routeValue(route.query.to) || isoDate(today),
  projectId: routeValue(route.query.projectId),
  network: routeValue(route.query.network) as StatisticsFilters["network"],
});
const result = ref<StatisticsResult | null>(null);
const loading = ref(true);
const exporting = ref(false);
const error = ref("");
const announcement = ref("");

const statusRows = computed(() =>
  (result.value?.byStatus ?? []).map((row) => ({
    ...row,
    label:
      PUBLICATION_STATUS_LABELS[
        row.key as keyof typeof PUBLICATION_STATUS_LABELS
      ] ?? row.key,
  })),
);
const networkRows = computed(() =>
  (result.value?.byNetwork ?? []).map((row) => ({
    ...row,
    label: row.key.charAt(0).toUpperCase() + row.key.slice(1),
  })),
);
const projectRows = computed(() =>
  (result.value?.byProject ?? []).map((row) => ({
    key: row.id,
    label: row.label,
    count: row.count,
  })),
);

function persistedQuery() {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== ""),
  );
}

async function load(message = "") {
  loading.value = true;
  error.value = "";
  try {
    const response = await api.get(filters);
    result.value = response.data;
    announcement.value =
      message ||
      `Statistiques actualisées : ${response.data.totals.publications} publication(s).`;
  } catch {
    error.value =
      "Les statistiques sont momentanément indisponibles. Vérifiez la période puis réessayez.";
  } finally {
    loading.value = false;
  }
}

async function applyFilters() {
  await router.replace({ query: persistedQuery() });
  await load("Filtres appliqués et statistiques actualisées.");
}

async function exportCsv() {
  exporting.value = true;
  error.value = "";
  try {
    const blob = await api.exportCsv(filters);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wepost-statistiques-${filters.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    announcement.value = "L’export CSV est téléchargé.";
  } catch {
    error.value = "L’export CSV n’a pas pu être généré.";
  } finally {
    exporting.value = false;
  }
}

function formatPercent(value: number | null) {
  return value === null ? "N/A" : `${value.toLocaleString("fr-FR")} %`;
}

function formatHours(value: number | null) {
  return value === null ? "N/A" : `${value.toLocaleString("fr-FR")} h`;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} o`;
  if (value < 1024 ** 2)
    return `${(value / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Ko`;
  return `${(value / 1024 ** 2).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

await load();
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <div class="page-heading">
        <div>
          <h1>Statistiques agence</h1>
          <p class="dashboard__lead">
            Suivez l’activité éditoriale avec des métriques calculées uniquement
            à partir des données disponibles.
          </p>
        </div>
        <button
          type="button"
          :disabled="loading"
          @click="load('Statistiques actualisées.')"
        >
          Actualiser
        </button>
      </div>

      <p class="status-message" role="status" aria-live="polite">
        {{ loading ? "Calcul en cours…" : announcement }}
      </p>
      <p v-if="error" class="error-summary" role="alert">{{ error }}</p>

      <form
        class="statistics-filters"
        aria-label="Filtres statistiques"
        @submit.prevent="applyFilters"
      >
        <label>
          Du (UTC)
          <input v-model="filters.from" type="date" required />
        </label>
        <label>
          Au (UTC)
          <input v-model="filters.to" type="date" required />
        </label>
        <label>
          Projet
          <select v-model="filters.projectId">
            <option value="">Tous les projets</option>
            <option
              v-for="project in result?.filters.projects ?? []"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </label>
        <label>
          Réseau
          <select v-model="filters.network">
            <option value="">Tous les réseaux</option>
            <option
              v-for="network in SOCIAL_NETWORKS"
              :key="network"
              :value="network"
            >
              {{ network }}
            </option>
          </select>
        </label>
        <button type="submit" :disabled="loading">Appliquer</button>
        <button
          type="button"
          :disabled="loading || exporting"
          @click="exportCsv"
        >
          {{ exporting ? "Export en cours…" : "Exporter en CSV" }}
        </button>
      </form>

      <template v-if="result">
        <section aria-labelledby="statistics-summary-title">
          <h2 id="statistics-summary-title">Résumé de la période</h2>
          <dl class="statistics-summary">
            <div>
              <dt>Publications créées</dt>
              <dd>{{ result.totals.publications }}</dd>
            </div>
            <div>
              <dt>Taux de succès</dt>
              <dd>{{ formatPercent(result.totals.successRate) }}</dd>
            </div>
            <div>
              <dt>Délai moyen d’approbation</dt>
              <dd>{{ formatHours(result.totals.meanApprovalHours) }}</dd>
            </div>
            <div>
              <dt>Commentaires</dt>
              <dd>{{ result.totals.comments }}</dd>
            </div>
            <div>
              <dt>Corrections demandées</dt>
              <dd>{{ result.totals.corrections }}</dd>
            </div>
            <div>
              <dt>Médias</dt>
              <dd>
                {{ result.totals.mediaCount }} ·
                {{ formatBytes(result.totals.mediaBytes) }}
              </dd>
            </div>
          </dl>
        </section>

        <div class="statistics-grid">
          <StatisticsBarChart
            title="Par statut"
            description="Statut courant des publications créées pendant la période."
            :rows="statusRows"
          />
          <StatisticsBarChart
            title="Par réseau"
            description="Une publication ciblant plusieurs réseaux compte dans chaque réseau."
            :rows="networkRows"
          />
          <StatisticsBarChart
            title="Par projet"
            description="Répartition des publications créées par projet."
            :rows="projectRows"
          />
        </div>

        <section
          class="statistics-remote"
          aria-labelledby="remote-statistics-title"
        >
          <h2 id="remote-statistics-title">Audience des réseaux sociaux</h2>
          <p>
            <strong>{{ result.remote.label }}</strong> —
            {{ result.remote.reason }}
          </p>
          <p>
            Aucune donnée distante n’est mélangée aux métriques métier
            ci-dessus.
          </p>
        </section>

        <details class="statistics-definitions">
          <summary>Définition des métriques</summary>
          <dl>
            <div>
              <dt>Publications</dt>
              <dd>Publications créées entre les deux dates, en UTC.</dd>
            </div>
            <div>
              <dt>Taux de succès</dt>
              <dd>
                Programmations publiées divisées par les programmations publiées
                ou échouées.
              </dd>
            </div>
            <div>
              <dt>Délai d’approbation</dt>
              <dd>
                Temps moyen entre la dernière soumission en revue et
                l’approbation client. N/A si ce lien n’est pas mesurable.
              </dd>
            </div>
            <div>
              <dt>Médias</dt>
              <dd>Médias non supprimés ajoutés pendant la période.</dd>
            </div>
          </dl>
        </details>
      </template>
    </main>
  </PrivateShell>
</template>
