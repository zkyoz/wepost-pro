<script setup lang="ts">
import type { InstagramAccount } from "~/types/instagram";
import { getApiErrors } from "~/utils/api-errors";

definePageMeta({
  middleware: ["auth", "role"],
  requiredRoles: ["admin", "agency"],
});
useHead({ title: "Connexion Instagram" });
const { user } = useAuth();
const api = useInstagramApi();
const accounts = ref<InstagramAccount[]>((await api.accounts()).data);
const instagramAccountId = ref("17841400000000000");
const agencyId = ref("");
const isLoading = ref(false);
const isHydrated = ref(false);
const error = ref("");
const announcement = ref(
  useRoute().query.instagram === "connected" ||
    accounts.value.some((account) => account.status === "connected")
    ? "Le compte Instagram est connecté."
    : "",
);

onMounted(() => {
  isHydrated.value = true;
  if (useRoute().query.instagram === "connected") {
    announcement.value = "Le compte Instagram est connecté.";
  }
});

function errorText(cause: unknown) {
  return (
    getApiErrors(cause)[0]?.message ??
    (cause instanceof Error
      ? cause.message
      : "La connexion Instagram a échoué.")
  );
}

async function connect() {
  error.value = "";
  isLoading.value = true;
  try {
    const result = await api.startOAuth({
      instagramAccountId: instagramAccountId.value,
      ...(user.value?.role === "admin" ? { agencyId: agencyId.value } : {}),
    });
    window.location.assign(result.data.authorizationUrl);
  } catch (cause) {
    error.value = errorText(cause);
    isLoading.value = false;
  }
}

async function revoke(account: InstagramAccount) {
  if (!window.confirm(`Déconnecter « ${account.externalAccountName} » ?`))
    return;
  const updated = (await api.revoke(account.id)).data;
  accounts.value = accounts.value.map((item) =>
    item.id === updated.id ? updated : item,
  );
  announcement.value = "Le compte Instagram est déconnecté.";
}
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li><NuxtLink to="/dashboard">Espace privé</NuxtLink></li>
          <li aria-current="page">Instagram</li>
        </ol>
      </nav>
      <div class="page-heading"><h1>Connexion Instagram</h1></div>
      <p class="status-message" role="status" aria-live="polite">
        {{ announcement }}
      </p>
      <p v-if="error" class="error-summary" role="alert">{{ error }}</p>

      <section
        class="publication-detail"
        aria-labelledby="instagram-connect-title"
      >
        <h2 id="instagram-connect-title">Connecter un compte professionnel</h2>
        <p>
          Renseignez l’identifiant exact du compte Instagram Business ou Creator
          lié à une Page Facebook. Un profil personnel n’est pas pris en charge
          par l’API de publication retenue.
        </p>
        <form @submit.prevent="connect">
          <label for="instagram-account-id"
            >Identifiant du compte Instagram</label
          >
          <input
            id="instagram-account-id"
            v-model="instagramAccountId"
            inputmode="numeric"
            pattern="[0-9]{5,30}"
            required
            autocomplete="off"
          />
          <template v-if="user?.role === 'admin'">
            <label for="instagram-agency-id">Identifiant de l’agence</label>
            <input
              id="instagram-agency-id"
              v-model="agencyId"
              required
              autocomplete="off"
            />
          </template>
          <button type="submit" :disabled="!isHydrated || isLoading">
            {{ isLoading ? "Redirection…" : "Continuer avec Instagram" }}
          </button>
        </form>
      </section>

      <section
        class="publication-detail"
        aria-labelledby="instagram-accounts-title"
      >
        <h2 id="instagram-accounts-title">Comptes connectés</h2>
        <p v-if="!accounts.length">Aucun compte connecté.</p>
        <ul v-else class="instagram-account-list">
          <li v-for="account in accounts" :key="account.id">
            <h3>{{ account.externalAccountName }}</h3>
            <p>
              Compte {{ account.externalAccountId }} — statut :
              {{ account.status }}
            </p>
            <p>Permissions : {{ account.scopes.join(", ") || "Aucune" }}</p>
            <p>
              Expiration :
              <time v-if="account.expiresAt" :datetime="account.expiresAt">{{
                new Date(account.expiresAt).toLocaleString("fr-FR")
              }}</time>
              <span v-else>non fournie par Instagram</span>
            </p>
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
