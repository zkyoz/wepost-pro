<script setup lang="ts">
import type { PinterestAccount } from "~/types/pinterest";
import { getApiErrors } from "~/utils/api-errors";

definePageMeta({
  middleware: ["auth", "role"],
  requiredRoles: ["admin", "agency"],
});
useHead({ title: "Connexion Pinterest" });
const { user } = useAuth();
const api = usePinterestApi();
const accounts = ref<PinterestAccount[]>((await api.accounts()).data);
const agencyId = ref("");
const isLoading = ref(false);
const isHydrated = ref(false);
const error = ref("");
const announcement = ref(
  useRoute().query.pinterest === "connected" ||
    accounts.value.some((account) => account.status === "connected")
    ? "Le compte Pinterest est connecté."
    : "",
);

onMounted(() => {
  isHydrated.value = true;
  if (useRoute().query.pinterest === "connected") {
    announcement.value = "Le compte Pinterest est connecté.";
  }
});

function errorText(cause: unknown) {
  return (
    getApiErrors(cause)[0]?.message ??
    (cause instanceof Error
      ? cause.message
      : "La connexion Pinterest a échoué.")
  );
}

async function connect() {
  error.value = "";
  isLoading.value = true;
  try {
    const result = await api.startOAuth({
      ...(user.value?.role === "admin" ? { agencyId: agencyId.value } : {}),
    });
    window.location.assign(result.data.authorizationUrl);
  } catch (cause) {
    error.value = errorText(cause);
    isLoading.value = false;
  }
}

async function revoke(account: PinterestAccount) {
  if (!window.confirm(`Déconnecter « ${account.externalAccountName} » ?`))
    return;
  const updated = (await api.revoke(account.id)).data;
  accounts.value = accounts.value.map((item) =>
    item.id === updated.id ? updated : item,
  );
  announcement.value = "Le compte Pinterest est déconnecté.";
}

async function refresh(account: PinterestAccount) {
  error.value = "";
  isLoading.value = true;
  try {
    const updated = (await api.refresh(account.id)).data;
    accounts.value = accounts.value.map((item) =>
      item.id === updated.id ? updated : item,
    );
    announcement.value = "L’accès Pinterest a été renouvelé.";
  } catch (cause) {
    error.value = errorText(cause);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li><NuxtLink to="/dashboard">Espace privé</NuxtLink></li>
          <li aria-current="page">Pinterest</li>
        </ol>
      </nav>
      <div class="page-heading"><h1>Connexion Pinterest</h1></div>
      <p class="status-message" role="status" aria-live="polite">
        {{ announcement }}
      </p>
      <p v-if="error" class="error-summary" role="alert">{{ error }}</p>

      <section
        class="publication-detail"
        aria-labelledby="pinterest-connect-title"
      >
        <h2 id="pinterest-connect-title">Connecter un compte Pinterest</h2>
        <p>
          Pinterest demandera l’accès minimal au compte, aux tableaux et aux
          Pins. Le tableau cible sera choisi pour chaque publication.
        </p>
        <form @submit.prevent="connect">
          <template v-if="user?.role === 'admin'">
            <label for="pinterest-agency-id">Identifiant de l’agence</label>
            <input
              id="pinterest-agency-id"
              v-model="agencyId"
              required
              autocomplete="off"
            />
          </template>
          <button type="submit" :disabled="!isHydrated || isLoading">
            {{ isLoading ? "Redirection…" : "Continuer avec Pinterest" }}
          </button>
        </form>
      </section>

      <section
        class="publication-detail"
        aria-labelledby="pinterest-accounts-title"
      >
        <h2 id="pinterest-accounts-title">Comptes connectés</h2>
        <p v-if="!accounts.length">Aucun compte connecté.</p>
        <ul v-else class="pinterest-account-list">
          <li v-for="account in accounts" :key="account.id">
            <h3>{{ account.externalAccountName }}</h3>
            <p>
              Compte {{ account.externalAccountId }} — statut :
              {{ account.status }}
            </p>
            <p>Permissions : {{ account.scopes.join(", ") || "Aucune" }}</p>
            <p>
              Tableaux disponibles :
              {{
                account.boards.map((board) => board.name).join(", ") || "Aucun"
              }}
            </p>
            <p>
              Expiration :
              <time v-if="account.expiresAt" :datetime="account.expiresAt">{{
                new Date(account.expiresAt).toLocaleString("fr-FR")
              }}</time>
              <span v-else>non fournie par Pinterest</span>
            </p>
            <button
              v-if="account.canRefresh && account.status !== 'revoked'"
              type="button"
              :disabled="isLoading"
              @click="refresh(account)"
            >
              Renouveler l’accès
            </button>
            <button
              v-if="account.status === 'connected'"
              type="button"
              @click="revoke(account)"
            >
              Déconnecter ce compte
            </button>
          </li>
        </ul>
      </section>
    </main>
  </PrivateShell>
</template>
