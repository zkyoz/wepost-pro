<script setup lang="ts">
const { consent, isEnabled, restoreConsent, acceptAnalytics, refuseAnalytics } =
  useAnalyticsConsent();

onMounted(restoreConsent);
</script>

<template>
  <aside
    v-if="isEnabled && consent === 'pending'"
    class="consent-banner"
    aria-labelledby="consent-title"
    aria-describedby="consent-description"
  >
    <div>
      <h2 id="consent-title">Mesure d’audience</h2>
      <p id="consent-description">
        Avec votre accord, PostHog Cloud EU nous aide à comprendre l’usage du
        site. Aucun suivi n’est lancé avant votre choix.
        <NuxtLink to="/confidentialite">En savoir plus</NuxtLink>.
      </p>
    </div>
    <div class="consent-banner__actions">
      <button type="button" @click="refuseAnalytics">Refuser</button>
      <button type="button" @click="acceptAnalytics">Accepter</button>
    </div>
  </aside>
</template>
