<script setup lang="ts">
import type { LinkedInAccount } from "~/types/linkedin";
import { getApiErrors } from "~/utils/api-errors";

definePageMeta({
  middleware: ["auth", "role"],
  requiredRoles: ["admin", "agency"],
});
useHead({ title: "Connexion LinkedIn" });
const { user } = useAuth();
const api = useLinkedInApi();
const accounts = ref<LinkedInAccount[]>((await api.accounts()).data);
const organizationId = ref("123456789");
const agencyId = ref("");
const isLoading = ref(false);
const isHydrated = ref(false);
const error = ref("");
const announcement = ref(
  useRoute().query.linkedin === "connected" ||
    accounts.value.some((account) => account.status === "connected")
    ? "Le compte LinkedIn est connecté."
    : "",
);

onMounted(() => {
  isHydrated.value = true;
  if (useRoute().query.linkedin === "connected") {
    announcement.value = "Le compte LinkedIn est connecté.";
  }
});

function errorText(cause: unknown) {
  return (
    getApiErrors(cause)[0]?.message ??
    (cause instanceof Error ? cause.message : "La connexion LinkedIn a échoué.")
  );
}

async function connect() {
  error.value = "";
  isLoading.value = true;
  try {
    const result = await api.startOAuth({
      organizationId: organizationId.value,
      ...(user.value?.role === "admin" ? { agencyId: agencyId.value } : {}),
    });
    window.location.assign(result.data.authorizationUrl);
  } catch (cause) {
    error.value = errorText(cause);
    isLoading.value = false;
  }
}

async function revoke(account: LinkedInAccount) {
  if (!window.confirm(`Déconnecter « ${account.externalAccountName} » ?`))
    return;
  const updated = (await api.revoke(account.id)).data;
  accounts.value = accounts.value.map((item) =>
    item.id === updated.id ? updated : item,
  );
  announcement.value = "Le compte LinkedIn est déconnecté.";
}

async function refresh(account: LinkedInAccount) {
  error.value = "";
  isLoading.value = true;
  try {
    const updated = (await api.refresh(account.id)).data;
    accounts.value = accounts.value.map((item) =>
      item.id === updated.id ? updated : item,
    );
    announcement.value = "L’accès LinkedIn a été renouvelé.";
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
          <li aria-current="page">LinkedIn</li>
        </ol>
      </nav>
      <div class="page-heading"><h1>Connexion LinkedIn</h1></div>
      <p class="status-message" role="status" aria-live="polite">
        {{ announcement }}
      </p>
      <p v-if="error" class="error-summary" role="alert">{{ error }}</p>

      <section
        class="publication-detail"
        aria-labelledby="linkedin-connect-title"
      >
        <h2 id="linkedin-connect-title">Connecter une organisation</h2>
        <p>
          Renseignez l’identifiant exact de l’organisation LinkedIn cible. Après
          autorisation, Wepost vérifie que votre compte possède un rôle autorisé
          à publier pour cette organisation.
        </p>
        <form @submit.prevent="connect">
          <label for="linkedin-account-id"
            >Identifiant de l’organisation LinkedIn</label
          >
          <input
            id="linkedin-account-id"
            v-model="organizationId"
            inputmode="numeric"
            pattern="[0-9]{5,30}"
            required
            autocomplete="off"
          />
          <template v-if="user?.role === 'admin'">
            <label for="linkedin-agency-id">Identifiant de l’agence</label>
            <input
              id="linkedin-agency-id"
              v-model="agencyId"
              required
              autocomplete="off"
            />
          </template>
          <button type="submit" :disabled="!isHydrated || isLoading">
            {{ isLoading ? "Redirection…" : "Continuer avec LinkedIn" }}
          </button>
        </form>
      </section>

      <section
        class="publication-detail"
        aria-labelledby="linkedin-accounts-title"
      >
        <h2 id="linkedin-accounts-title">Comptes connectés</h2>
        <p v-if="!accounts.length">Aucun compte connecté.</p>
        <ul v-else class="linkedin-account-list">
          <li v-for="account in accounts" :key="account.id">
            <h3>{{ account.externalAccountName }}</h3>
            <p>
              Organisation {{ account.externalAccountId }} — statut :
              {{ account.status }}
            </p>
            <p>Permissions : {{ account.scopes.join(", ") || "Aucune" }}</p>
            <p>
              Expiration :
              <time v-if="account.expiresAt" :datetime="account.expiresAt">{{
                new Date(account.expiresAt).toLocaleString("fr-FR")
              }}</time>
              <span v-else>non fournie par LinkedIn</span>
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
