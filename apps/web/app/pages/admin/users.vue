<script setup lang="ts">
import {
  ROLE_LABELS,
  USER_ROLES,
  type PublicUser,
  type UserRole,
} from "~/types/auth";

definePageMeta({ middleware: ["auth", "role"], requiredRoles: ["admin"] });
useHead({ title: "Gestion des utilisateurs" });

const { $api } = useNuxtApp();
const { user: currentUser } = useAuth();
const adminApi = useAdminApi($api);
const users = ref<PublicUser[]>([]);
const pendingRoles = reactive<Record<string, UserRole>>({});
const statusMessage = ref("");
const error = ref("");
const loading = ref(false);
const q = ref("");
const role = ref<UserRole | "">("");
const status = ref<"active" | "inactive" | "">("");
const page = ref(1);
const meta = ref({ total: 0, currentPage: 1, lastPage: 1, perPage: 20 });
const confirmDialog = ref<{ open: () => Promise<void> }>();
const detailsDialog = ref<{ open: () => Promise<void> }>();
const selectedUser = ref<Record<string, unknown> | null>(null);
const pendingAction = ref<{
  type: "role" | "status";
  user: PublicUser;
} | null>(null);

async function loadUsers() {
  loading.value = true;
  error.value = "";
  try {
    const response = await adminApi.users({
      page: page.value,
      q: q.value || undefined,
      role: role.value || undefined,
      status: status.value || undefined,
    });
    users.value = response.data;
    meta.value = response.meta;
    for (const user of users.value) pendingRoles[user.id] = user.role;
    statusMessage.value = `${response.meta.total} utilisateur(s) trouvé(s).`;
  } finally {
    loading.value = false;
  }
}

function replaceUser(response: { data: PublicUser }) {
  const index = users.value.findIndex((user) => user.id === response.data.id);
  if (index >= 0) users.value[index] = response.data;
  statusMessage.value = `Le compte de ${response.data.displayName} a été mis à jour.`;
}

async function requestAction(type: "role" | "status", user: PublicUser) {
  pendingAction.value = { type, user };
  await nextTick();
  await confirmDialog.value?.open();
}

async function confirmAction() {
  if (!pendingAction.value) return;
  error.value = "";
  const { type, user } = pendingAction.value;
  try {
    const response =
      type === "role"
        ? await adminApi.updateUserRole(user.id, pendingRoles[user.id]!)
        : await adminApi.updateUserStatus(user.id, !user.isActive);
    replaceUser(response);
  } catch {
    error.value = "La modification n’a pas pu être appliquée.";
    pendingRoles[user.id] = user.role;
  } finally {
    pendingAction.value = null;
  }
}

async function showDetails(user: PublicUser) {
  selectedUser.value = (await adminApi.user(user.id)).data as unknown as Record<
    string,
    unknown
  >;
  await nextTick();
  await detailsDialog.value?.open();
}

async function search() {
  page.value = 1;
  await loadUsers();
}

async function changePage(next: number) {
  page.value = next;
  await loadUsers();
  document.querySelector<HTMLElement>("#admin-users-title")?.focus();
}

await loadUsers();
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li><NuxtLink to="/admin">Administration</NuxtLink></li>
          <li aria-current="page">Utilisateurs</li>
        </ol>
      </nav>
      <p class="auth-form__eyebrow">Administration</p>
      <h1 id="admin-users-title" tabindex="-1">Gestion des utilisateurs</h1>
      <p class="dashboard__lead">
        Attribuez un rôle ou désactivez un compte. Votre propre compte ne peut
        pas être modifié.
      </p>
      <p class="status-message" role="status" aria-live="polite">
        {{ statusMessage }}
      </p>
      <p v-if="error" class="error-summary" role="alert">{{ error }}</p>
      <form class="project-filters" role="search" @submit.prevent="search">
        <div class="form-field">
          <label for="user-search">Nom ou adresse e-mail</label>
          <input id="user-search" v-model="q" type="search" maxlength="120" />
        </div>
        <div class="form-field">
          <label for="user-role">Rôle</label>
          <select id="user-role" v-model="role">
            <option value="">Tous</option>
            <option v-for="item in USER_ROLES" :key="item" :value="item">
              {{ ROLE_LABELS[item] }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label for="user-status">Statut</label>
          <select id="user-status" v-model="status">
            <option value="">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Désactivés</option>
          </select>
        </div>
        <button type="submit">Filtrer</button>
      </form>
      <p v-if="loading" role="status">Chargement des utilisateurs…</p>
      <div
        v-else-if="users.length"
        class="table-scroll"
        tabindex="0"
        aria-label="Utilisateurs et autorisations"
      >
        <table class="users-table">
          <caption>
            {{
              meta.total
            }}
            utilisateur(s)
          </caption>
          <thead>
            <tr>
              <th scope="col">Utilisateur</th>
              <th scope="col">Rôle</th>
              <th scope="col">Statut</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in users" :key="account.id">
              <th scope="row">
                {{ account.displayName }}
                <span class="user-email">{{ account.email }}</span>
              </th>
              <td>
                <label class="sr-only" :for="`role-${account.id}`"
                  >Rôle de {{ account.displayName }}</label
                >
                <select
                  :id="`role-${account.id}`"
                  v-model="pendingRoles[account.id]"
                  :disabled="account.id === currentUser?.id"
                >
                  <option
                    v-for="availableRole in USER_ROLES"
                    :key="availableRole"
                    :value="availableRole"
                  >
                    {{ ROLE_LABELS[availableRole] }}
                  </option>
                </select>
              </td>
              <td>{{ account.isActive ? "Actif" : "Désactivé" }}</td>
              <td class="table-actions">
                <button
                  type="button"
                  :disabled="
                    account.id === currentUser?.id ||
                    pendingRoles[account.id] === account.role
                  "
                  @click="requestAction('role', account)"
                >
                  Enregistrer le rôle
                </button>
                <button
                  type="button"
                  :disabled="account.id === currentUser?.id"
                  @click="requestAction('status', account)"
                >
                  {{ account.isActive ? "Désactiver" : "Réactiver" }}
                </button>
                <button type="button" @click="showDetails(account)">
                  Consulter le détail
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <section v-else class="empty-state" aria-labelledby="empty-users">
        <h2 id="empty-users">Aucun utilisateur trouvé</h2>
        <p>Modifiez les filtres de recherche.</p>
      </section>

      <nav
        v-if="meta.lastPage > 1"
        class="pagination"
        aria-label="Pagination des utilisateurs"
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
        title="Détail de l’utilisateur"
        :details="selectedUser"
      />
      <AdminConfirmDialog
        ref="confirmDialog"
        :title="
          pendingAction?.type === 'role'
            ? `Changer le rôle de « ${pendingAction?.user.displayName ?? ''} » ?`
            : `${pendingAction?.user.isActive ? 'Désactiver' : 'Réactiver'} « ${pendingAction?.user.displayName ?? ''} » ?`
        "
        message="Cette action administrative sera enregistrée dans le journal d’audit."
        :confirm-label="
          pendingAction?.type === 'role'
            ? 'Changer le rôle'
            : pendingAction?.user.isActive
              ? 'Désactiver'
              : 'Réactiver'
        "
        :danger="
          pendingAction?.type === 'status' && pendingAction?.user.isActive
        "
        @confirm="confirmAction"
      />
    </main>
  </PrivateShell>
</template>
