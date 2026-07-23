<script setup lang="ts">
import {
  PUBLICATION_STATUS_LABELS,
  SOCIAL_NETWORKS,
} from "~/types/publication";
import {
  SUPERVISION_CATEGORIES,
  SUPERVISION_LABELS,
  type SupervisionCategory,
  type SupervisionFilters,
  type SupervisionItem,
  type SupervisionItemsResponse,
  type SupervisionSummary,
} from "~/types/supervision";

definePageMeta({
  middleware: ["auth", "role"],
  requiredRoles: ["admin", "agency"],
});
useHead({ title: "Supervision métier" });

const route = useRoute();
const router = useRouter();
const api = useSupervisionApi();

function routeValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

const requestedCategory = routeValue(
  route.query.category,
) as SupervisionCategory;
const category = ref<SupervisionCategory>(
  SUPERVISION_CATEGORIES.includes(requestedCategory)
    ? requestedCategory
    : "unread_comments",
);
const filters = reactive<SupervisionFilters>({
  clientId: routeValue(route.query.clientId),
  projectId: routeValue(route.query.projectId),
  network: routeValue(route.query.network) as SupervisionFilters["network"],
  from: routeValue(route.query.from),
  to: routeValue(route.query.to),
  responsibleId: routeValue(route.query.responsibleId),
});
const summary = ref<SupervisionSummary | null>(null);
const items = ref<SupervisionItemsResponse | null>(null);
const page = ref(Math.max(1, Number(route.query.page) || 1));
const loading = ref(true);
const error = ref("");
const announcement = ref("");

function persistedQuery() {
  return Object.fromEntries(
    Object.entries({
      ...filters,
      category: category.value,
      page: page.value,
    }).filter(
      ([, value]) => value !== "" && value !== undefined && value !== 1,
    ),
  );
}

async function loadItems() {
  items.value = await api.items(category.value, filters, page.value);
}

async function loadAll(message = "") {
  loading.value = true;
  error.value = "";
  try {
    const [summaryResult] = await Promise.all([
      api.summary(filters),
      loadItems(),
    ]);
    summary.value = summaryResult.data;
    announcement.value =
      message ||
      `Supervision actualisée : ${summary.value.actionRequired} élément(s) à traiter.`;
  } catch {
    error.value = "La supervision est momentanément indisponible. Réessayez.";
  } finally {
    loading.value = false;
  }
}

async function persistAndLoad(all = true) {
  await router.replace({ query: persistedQuery() });
  if (all) await loadAll();
  else {
    loading.value = true;
    error.value = "";
    try {
      await loadItems();
      announcement.value = `${items.value?.meta.total ?? 0} élément(s) dans la catégorie ${SUPERVISION_LABELS[category.value]}.`;
    } catch {
      error.value = "La liste est momentanément indisponible. Réessayez.";
    } finally {
      loading.value = false;
    }
  }
}

async function selectCategory(next: SupervisionCategory) {
  category.value = next;
  page.value = 1;
  await persistAndLoad(false);
  await nextTick();
  document.querySelector<HTMLElement>("#supervision-results-title")?.focus();
}

async function applyFilters() {
  page.value = 1;
  await persistAndLoad();
}

async function changePage(next: number) {
  page.value = next;
  await persistAndLoad(false);
  await nextTick();
  document.querySelector<HTMLElement>("#supervision-results-title")?.focus();
}

async function markRead(item: SupervisionItem) {
  if (!item.notificationId) return;
  await api.markCommentRead(item.notificationId);
  await loadAll(
    "Le commentaire est marqué comme lu et reste dans l’historique.",
  );
}

function displayDate(value: string) {
  return new Date(value).toLocaleString("fr-FR");
}

await loadAll();
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <div class="page-heading">
        <div>
          <h1>Supervision métier</h1>
          <p class="dashboard__lead">
            Identifiez les publications et commentaires qui nécessitent une
            action.
          </p>
        </div>
        <button
          type="button"
          :disabled="loading"
          @click="loadAll('Supervision actualisée.')"
        >
          Actualiser
        </button>
      </div>

      <p class="status-message" role="status" aria-live="polite">
        {{ loading ? "Actualisation en cours…" : announcement }}
      </p>
      <p v-if="error" class="error-summary" role="alert">{{ error }}</p>

      <template v-if="summary">
        <p class="supervision-priority">
          <strong>{{ summary.actionRequired }}</strong> élément(s) nécessitent
          une action.
        </p>
        <SupervisionSummaryCards
          :counts="summary.counts"
          :selected="category"
          :loading="loading"
          @select="selectCategory"
        />

        <form
          class="supervision-filters"
          aria-label="Filtres de supervision"
          @submit.prevent="applyFilters"
        >
          <label>
            Client
            <select v-model="filters.clientId">
              <option value="">Tous les clients</option>
              <option
                v-for="client in summary.filters.clients"
                :key="client.id"
                :value="client.id"
              >
                {{ client.name }}
              </option>
            </select>
          </label>
          <label>
            Projet
            <select v-model="filters.projectId">
              <option value="">Tous les projets</option>
              <option
                v-for="project in summary.filters.projects"
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
          <label>
            Du
            <input v-model="filters.from" type="date" />
          </label>
          <label>
            Au
            <input v-model="filters.to" type="date" />
          </label>
          <label>
            Responsable
            <select v-model="filters.responsibleId">
              <option value="">Tous les responsables</option>
              <option
                v-for="person in summary.filters.responsibles"
                :key="person.id"
                :value="person.id"
              >
                {{ person.name }}
              </option>
            </select>
          </label>
          <button type="submit" :disabled="loading">
            Appliquer les filtres
          </button>
        </form>
      </template>

      <section v-if="items" aria-labelledby="supervision-results-title">
        <div class="page-heading">
          <h2 id="supervision-results-title" tabindex="-1">
            {{ SUPERVISION_LABELS[category] }}
          </h2>
          <p>{{ items.meta.total }} résultat(s)</p>
        </div>
        <p v-if="!items.data.length" class="empty-state">
          Aucun élément dans cette catégorie.
        </p>
        <div v-else class="table-wrapper">
          <table class="admin-table supervision-table">
            <caption>
              Éléments de supervision —
              {{
                SUPERVISION_LABELS[category]
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">Publication</th>
                <th scope="col">Projet et client</th>
                <th scope="col">Statut</th>
                <th scope="col">Réseaux</th>
                <th scope="col">Responsable</th>
                <th scope="col">Activité</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in items.data"
                :key="`${category}-${item.notificationId ?? item.id}`"
              >
                <th scope="row">
                  <NuxtLink :to="`/publications/${item.id}`">{{
                    item.title
                  }}</NuxtLink>
                </th>
                <td>{{ item.projectName }}<br />{{ item.clientName }}</td>
                <td>{{ PUBLICATION_STATUS_LABELS[item.status] }}</td>
                <td>{{ item.targetNetworks.join(", ") }}</td>
                <td>{{ item.responsibleName }}</td>
                <td>
                  <time :datetime="item.activityAt">{{
                    displayDate(item.activityAt)
                  }}</time>
                </td>
                <td>
                  <button
                    v-if="item.notificationId"
                    type="button"
                    @click="markRead(item)"
                  >
                    Marquer comme lu
                  </button>
                  <NuxtLink v-else :to="`/publications/${item.id}`"
                    >Consulter</NuxtLink
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <nav
          v-if="items.meta.lastPage > 1"
          class="pagination"
          aria-label="Pagination de la supervision"
        >
          <button
            type="button"
            :disabled="page <= 1 || loading"
            @click="changePage(page - 1)"
          >
            Précédent
          </button>
          <span>Page {{ page }} sur {{ items.meta.lastPage }}</span>
          <button
            type="button"
            :disabled="page >= items.meta.lastPage || loading"
            @click="changePage(page + 1)"
          >
            Suivant
          </button>
        </nav>
      </section>
    </main>
  </PrivateShell>
</template>
