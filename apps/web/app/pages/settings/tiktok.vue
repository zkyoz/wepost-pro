<script setup lang="ts">
import type { TikTokAccount } from "~/types/tiktok";
import { getApiErrors } from "~/utils/api-errors";

definePageMeta({
  middleware: ["auth", "role"],
  requiredRoles: ["admin", "agency"],
});
useHead({ title: "Connexion TikTok" });
const { user } = useAuth();
const api = useTikTokApi();
const accounts = ref<TikTokAccount[]>((await api.accounts()).data);
const agencyId = ref("");
const isLoading = ref(false);
const isHydrated = ref(false);
const error = ref("");
const announcement = ref(
  useRoute().query.tiktok === "connected" ||
    accounts.value.some((account) => account.status === "connected")
    ? "Le compte TikTok est connecté."
    : "",
);

onMounted(() => {
  isHydrated.value = true;
  if (useRoute().query.tiktok === "connected") {
    announcement.value = "Le compte TikTok est connecté.";
  }
});

function errorText(cause: unknown) {
  return (
    getApiErrors(cause)[0]?.message ??
    (cause instanceof Error ? cause.message : "La connexion TikTok a échoué.")
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

async function revoke(account: TikTokAccount) {
  if (!window.confirm(`Déconnecter « ${account.externalAccountName} » ?`))
    return;
  const updated = (await api.revoke(account.id)).data;
  accounts.value = accounts.value.map((item) =>
    item.id === updated.id ? updated : item,
  );
  announcement.value = "Le compte TikTok est déconnecté.";
}

async function refresh(account: TikTokAccount) {
  error.value = "";
  isLoading.value = true;
  try {
    const updated = (await api.refresh(account.id)).data;
    accounts.value = accounts.value.map((item) =>
      item.id === updated.id ? updated : item,
    );
    announcement.value = "L’accès TikTok a été renouvelé.";
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
          <li aria-current="page">TikTok</li>
        </ol>
      </nav>
      <div class="page-heading"><h1>Connexion TikTok</h1></div>
      <p class="status-message" role="status" aria-live="polite">
        {{ announcement }}
      </p>
      <p v-if="error" class="error-summary" role="alert">{{ error }}</p>

      <section
        class="publication-detail"
        aria-labelledby="tiktok-connect-title"
      >
        <h2 id="tiktok-connect-title">Connecter un compte TikTok</h2>
        <p>
          TikTok demandera uniquement l’accès au profil de base et à la
          publication vidéo. Les choix du créateur seront vérifiés avant chaque
          envoi.
        </p>
        <form @submit.prevent="connect">
          <template v-if="user?.role === 'admin'">
            <label for="tiktok-agency-id">Identifiant de l’agence</label>
            <input
              id="tiktok-agency-id"
              v-model="agencyId"
              required
              autocomplete="off"
            />
          </template>
          <button type="submit" :disabled="!isHydrated || isLoading">
            {{ isLoading ? "Redirection…" : "Continuer avec TikTok" }}
          </button>
        </form>
      </section>

      <section
        class="publication-detail"
        aria-labelledby="tiktok-accounts-title"
      >
        <h2 id="tiktok-accounts-title">Comptes connectés</h2>
        <p v-if="!accounts.length">Aucun compte connecté.</p>
        <ul v-else class="tiktok-account-list">
          <li v-for="account in accounts" :key="account.id">
            <h3>{{ account.externalAccountName }}</h3>
            <p>
              Compte {{ account.externalAccountId }} — statut :
              {{ account.status }}
            </p>
            <p>Permissions : {{ account.scopes.join(", ") || "Aucune" }}</p>
            <p>
              Confidentialités disponibles :
              {{
                account.creatorInfo.privacyLevelOptions.join(", ") || "Aucune"
              }}
            </p>
            <p>
              Durée vidéo maximale :
              {{ account.creatorInfo.maxVideoPostDurationSec }} secondes.
            </p>
            <p>
              Expiration :
              <time v-if="account.expiresAt" :datetime="account.expiresAt">{{
                new Date(account.expiresAt).toLocaleString("fr-FR")
              }}</time>
              <span v-else>non fournie par TikTok</span>
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
