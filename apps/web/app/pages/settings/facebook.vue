<script setup lang="ts">
import type { FacebookAccount } from "~/types/facebook";
import { getApiErrors } from "~/utils/api-errors";

definePageMeta({
  middleware: ["auth", "role"],
  requiredRoles: ["admin", "agency"],
});
useHead({ title: "Connexion Facebook" });
const { user } = useAuth();
const api = useFacebookApi();
const accounts = ref<FacebookAccount[]>((await api.accounts()).data);
const pageId = ref("1234567890");
const agencyId = ref("");
const isLoading = ref(false);
const error = ref("");
const announcement = ref(
  useRoute().query.facebook === "connected" ||
    accounts.value.some((account) => account.status === "connected")
    ? "La Page Facebook est connectée."
    : "",
);

onMounted(() => {
  if (useRoute().query.facebook === "connected") {
    announcement.value = "La Page Facebook est connectée.";
  }
});

function errorText(cause: unknown) {
  return (
    getApiErrors(cause)[0]?.message ??
    (cause instanceof Error ? cause.message : "La connexion Facebook a échoué.")
  );
}

async function connect() {
  error.value = "";
  isLoading.value = true;
  try {
    const result = await api.startOAuth({
      pageId: pageId.value,
      ...(user.value?.role === "admin" ? { agencyId: agencyId.value } : {}),
    });
    window.location.assign(result.data.authorizationUrl);
  } catch (cause) {
    error.value = errorText(cause);
    isLoading.value = false;
  }
}

async function revoke(account: FacebookAccount) {
  if (!window.confirm(`Déconnecter « ${account.externalAccountName} » ?`))
    return;
  const updated = (await api.revoke(account.id)).data;
  accounts.value = accounts.value.map((item) =>
    item.id === updated.id ? updated : item,
  );
  announcement.value = "La Page Facebook est déconnectée.";
}
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li><NuxtLink to="/dashboard">Espace privé</NuxtLink></li>
          <li aria-current="page">Facebook</li>
        </ol>
      </nav>
      <div class="page-heading"><h1>Connexion Facebook</h1></div>
      <p class="status-message" role="status" aria-live="polite">
        {{ announcement }}
      </p>
      <p v-if="error" class="error-summary" role="alert">{{ error }}</p>

      <section
        class="publication-detail"
        aria-labelledby="facebook-connect-title"
      >
        <h2 id="facebook-connect-title">Connecter une Page gérée</h2>
        <p>
          Renseignez l’identifiant exact de la Page. Un profil personnel ne peut
          pas être sélectionné.
        </p>
        <form @submit.prevent="connect">
          <label for="facebook-page-id">Identifiant de la Page Facebook</label>
          <input
            id="facebook-page-id"
            v-model="pageId"
            inputmode="numeric"
            pattern="[0-9]{5,30}"
            required
            autocomplete="off"
          />
          <template v-if="user?.role === 'admin'">
            <label for="facebook-agency-id">Identifiant de l’agence</label>
            <input
              id="facebook-agency-id"
              v-model="agencyId"
              required
              autocomplete="off"
            />
          </template>
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? "Redirection…" : "Continuer avec Facebook" }}
          </button>
        </form>
      </section>

      <section
        class="publication-detail"
        aria-labelledby="facebook-accounts-title"
      >
        <h2 id="facebook-accounts-title">Pages connectées</h2>
        <p v-if="!accounts.length">Aucune Page connectée.</p>
        <ul v-else class="facebook-account-list">
          <li v-for="account in accounts" :key="account.id">
            <h3>{{ account.externalAccountName }}</h3>
            <p>
              Page {{ account.externalAccountId }} — statut :
              {{ account.status }}
            </p>
            <p>Permissions : {{ account.scopes.join(", ") || "Aucune" }}</p>
            <p>
              Expiration :
              <time v-if="account.expiresAt" :datetime="account.expiresAt">{{
                new Date(account.expiresAt).toLocaleString("fr-FR")
              }}</time>
              <span v-else>non fournie par Facebook</span>
            </p>
            <button
              v-if="account.status === 'connected'"
              type="button"
              @click="revoke(account)"
            >
              Déconnecter cette Page
            </button>
          </li>
        </ul>
      </section>
    </main>
  </PrivateShell>
</template>
