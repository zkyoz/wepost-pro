<script setup lang="ts">
import type { AdminResource, AdminResourceName } from "~/types/admin";
import { getApiErrors } from "~/utils/api-errors";

definePageMeta({ middleware: ["auth", "role"], requiredRoles: ["admin"] });
useHead({ title: "Ressources administratives" });

type AdminRow = {
  id: string;
  primary: string;
  secondary: string;
  kind: string;
  status: string;
  date: string;
  resource: AdminResource;
};

const allowedViews: readonly AdminResourceName[] = [
  "projects",
  "publications",
  "social-accounts",
  "incidents",
  "audit-logs",
];
const labels: Record<AdminResourceName, string> = {
  projects: "Projets",
  publications: "Publications",
  "social-accounts": "Comptes sociaux",
  incidents: "Incidents",
  "audit-logs": "Journal d’audit",
};
const route = useRoute();
const router = useRouter();
const api = useAdminApi();
const currentView = computed<AdminResourceName>(() => {
  const requested = String(route.query.view ?? "projects") as AdminResourceName;
  return allowedViews.includes(requested) ? requested : "projects";
});
const records = ref<AdminResource[]>([]);
const meta = ref({ total: 0, currentPage: 1, lastPage: 1, perPage: 20 });
const q = ref("");
const status = ref("");
const page = ref(1);
const loading = ref(false);
const announcement = ref("");
const error = ref("");
const details = ref<Record<string, unknown> | null>(null);
const detailsTitle = ref("Détail de la ressource");
const detailsDialog = ref<{ open: () => Promise<void> }>();
const confirmDialog = ref<{ open: () => Promise<void> }>();
const pendingAction = ref<{
  resource: "projects" | "publications";
  id: string;
  action: "archive" | "restore";
  name: string;
} | null>(null);

const statusOptions = computed(() => {
  if (currentView.value === "projects")
    return [
      { value: "active", label: "Actifs" },
      { value: "archived", label: "Archivés" },
    ];
  if (currentView.value === "publications")
    return [
      "draft",
      "in_progress",
      "approved",
      "scheduled",
      "published",
      "failed",
      "archived",
    ].map((value) => ({ value, label: value }));
  if (currentView.value === "social-accounts")
    return ["connected", "expired", "revoked", "error"].map((value) => ({
      value,
      label: value,
    }));
  if (currentView.value === "incidents")
    return ["transient_failure", "permanent_failure"].map((value) => ({
      value,
      label: value,
    }));
  return [];
});

function objectOf(resource: AdminResource) {
  return resource as unknown as Record<string, unknown>;
}

function textValue(value: unknown, fallback = "Non renseigné") {
  return typeof value === "string" && value ? value : fallback;
}

function toRow(resource: AdminResource): AdminRow {
  const value = objectOf(resource);
  if (currentView.value === "projects") {
    return {
      id: textValue(value.id),
      primary: textValue(value.name),
      secondary: `Agence ${textValue(value.agencyId)}`,
      kind: "Projet",
      status: textValue(value.status),
      date: textValue(value.updatedAt),
      resource,
    };
  }
  if (currentView.value === "publications") {
    return {
      id: textValue(value.id),
      primary: textValue(value.title),
      secondary: `Projet ${textValue(value.projectId)}`,
      kind: "Publication",
      status: textValue(value.status),
      date: textValue(value.updatedAt),
      resource,
    };
  }
  if (currentView.value === "social-accounts") {
    return {
      id: textValue(value.id),
      primary: textValue(value.externalAccountName),
      secondary: textValue(value.externalAccountReference),
      kind: textValue(value.network),
      status: textValue(value.status),
      date: textValue(value.updatedAt),
      resource,
    };
  }
  if (currentView.value === "incidents") {
    return {
      id: textValue(value.id),
      primary: textValue(value.publicationTitle),
      secondary: `Tentative ${String(value.attempt ?? "")}`,
      kind: textValue(value.network),
      status: textValue(value.result),
      date: textValue(value.startedAt),
      resource,
    };
  }
  return {
    id: textValue(value.id),
    primary: textValue(value.action),
    secondary: textValue(value.actorName, "Système"),
    kind: textValue(value.entityType, "Système"),
    status: "Journalisé",
    date: textValue(value.createdAt),
    resource,
  };
}

const rows = computed(() => records.value.map(toRow));

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString("fr-FR");
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const query: Record<string, unknown> = {
      page: page.value,
      q: q.value || undefined,
    };
    if (status.value) {
      query[currentView.value === "incidents" ? "result" : "status"] =
        status.value;
    }
    const response = await api.resourceList(currentView.value, query);
    records.value = response.data;
    meta.value = response.meta;
    announcement.value = `${response.meta.total} résultat(s) dans ${labels[currentView.value]}.`;
  } catch (cause) {
    error.value = getApiErrors(cause)[0]?.message ?? "Le chargement a échoué.";
  } finally {
    loading.value = false;
  }
}

async function selectView(view: AdminResourceName) {
  q.value = "";
  status.value = "";
  page.value = 1;
  await router.push({ path: "/admin/resources", query: { view } });
}

async function search() {
  page.value = 1;
  await load();
}

async function changePage(next: number) {
  page.value = next;
  await load();
  document.querySelector<HTMLElement>("#admin-resources-title")?.focus();
}

async function showDetails(row: AdminRow) {
  error.value = "";
  try {
    const resource =
      currentView.value === "audit-logs"
        ? row.resource
        : (
            await api.resource(
              currentView.value as Exclude<AdminResourceName, "audit-logs">,
              row.id,
            )
          ).data;
    details.value = objectOf(resource);
    detailsTitle.value = `Détail — ${row.primary}`;
    await nextTick();
    await detailsDialog.value?.open();
  } catch (cause) {
    error.value =
      getApiErrors(cause)[0]?.message ?? "Le détail est indisponible.";
  }
}

async function requestArchive(row: AdminRow) {
  if (currentView.value !== "projects" && currentView.value !== "publications")
    return;
  const action = row.status === "archived" ? "restore" : "archive";
  pendingAction.value = {
    resource: currentView.value,
    id: row.id,
    action,
    name: row.primary,
  };
  await nextTick();
  await confirmDialog.value?.open();
}

async function confirmArchive() {
  if (!pendingAction.value) return;
  const action = pendingAction.value;
  error.value = "";
  try {
    const updated = (
      await api.changeArchiveState(action.resource, action.id, action.action)
    ).data;
    const index = records.value.findIndex(
      (record) => objectOf(record).id === action.id,
    );
    if (index >= 0) records.value[index] = updated;
    announcement.value = `${action.name} a été ${action.action === "archive" ? "archivé" : "restauré"}.`;
  } catch (cause) {
    error.value = getApiErrors(cause)[0]?.message ?? "L’action a échoué.";
  } finally {
    pendingAction.value = null;
  }
}

watch(currentView, async () => {
  status.value = "";
  page.value = 1;
  await load();
});

await load();
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li><NuxtLink to="/admin">Administration</NuxtLink></li>
          <li aria-current="page">{{ labels[currentView] }}</li>
        </ol>
      </nav>
      <h1 id="admin-resources-title" tabindex="-1">
        {{ labels[currentView] }}
      </h1>

      <nav class="admin-tabs" aria-label="Ressources administratives">
        <button
          v-for="view in allowedViews"
          :key="view"
          type="button"
          :aria-current="currentView === view ? 'page' : undefined"
          @click="selectView(view)"
        >
          {{ labels[view] }}
        </button>
      </nav>

      <form class="project-filters" role="search" @submit.prevent="search">
        <div class="form-field">
          <label for="admin-search">Rechercher</label>
          <input id="admin-search" v-model="q" type="search" maxlength="120" />
        </div>
        <div v-if="statusOptions.length" class="form-field">
          <label for="admin-status">État</label>
          <select id="admin-status" v-model="status">
            <option value="">Tous</option>
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
        <button type="submit">Filtrer</button>
      </form>

      <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>
      <p v-if="error" class="error-summary" role="alert">{{ error }}</p>
      <p v-if="loading" role="status">Chargement…</p>
      <section
        v-else-if="rows.length === 0"
        class="empty-state"
        aria-labelledby="empty-admin"
      >
        <h2 id="empty-admin">Aucun résultat</h2>
        <p>Modifiez les filtres pour élargir la recherche.</p>
      </section>
      <div
        v-else
        class="table-scroll"
        tabindex="0"
        :aria-label="labels[currentView]"
      >
        <table class="users-table admin-table">
          <caption>
            {{
              labels[currentView]
            }}
            —
            {{
              meta.total
            }}
            résultat(s)
          </caption>
          <thead>
            <tr>
              <th scope="col">Ressource</th>
              <th scope="col">Type</th>
              <th scope="col">État</th>
              <th scope="col">Dernière activité</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <th scope="row">
                {{ row.primary
                }}<span class="user-email">{{ row.secondary }}</span>
              </th>
              <td>{{ row.kind }}</td>
              <td>{{ row.status }}</td>
              <td>
                <time :datetime="row.date">{{ formatDate(row.date) }}</time>
              </td>
              <td class="table-actions">
                <button type="button" @click="showDetails(row)">
                  Consulter le détail
                </button>
                <button
                  v-if="
                    currentView === 'projects' || currentView === 'publications'
                  "
                  type="button"
                  @click="requestArchive(row)"
                >
                  {{ row.status === "archived" ? "Restaurer" : "Archiver" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav
        v-if="meta.lastPage > 1"
        class="pagination"
        :aria-label="`Pagination ${labels[currentView]}`"
      >
        <button
          type="button"
          :disabled="page <= 1"
          @click="changePage(page - 1)"
        >
          Précédent
        </button>
        <span>Page {{ page }} sur {{ meta.lastPage }}</span>
        <button
          type="button"
          :disabled="page >= meta.lastPage"
          @click="changePage(page + 1)"
        >
          Suivant
        </button>
      </nav>

      <AdminDetailsDialog
        ref="detailsDialog"
        :title="detailsTitle"
        :details="details"
      />
      <AdminConfirmDialog
        ref="confirmDialog"
        :title="`${pendingAction?.action === 'restore' ? 'Restaurer' : 'Archiver'} « ${pendingAction?.name ?? ''} » ?`"
        :message="
          pendingAction?.action === 'restore'
            ? 'La ressource redeviendra disponible dans son état antérieur.'
            : 'La ressource restera traçable dans le journal d’audit.'
        "
        :confirm-label="
          pendingAction?.action === 'restore' ? 'Restaurer' : 'Archiver'
        "
        :danger="pendingAction?.action !== 'restore'"
        @confirm="confirmArchive"
      />
    </main>
  </PrivateShell>
</template>
