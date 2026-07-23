<script setup lang="ts">
useSeoMeta({
  title: "Mentions légales",
  description: "Mentions légales du service Wepost.pro.",
  robots: "noindex,follow",
});
</script>

<template>
  <div class="public-page">
    <PublicHeader />
    <main id="main-content" class="legal-page">
      <div class="public-container legal-page__content">
        <p class="legal-page__back">
          <NuxtLink to="/">← Retour à l’accueil</NuxtLink>
        </p>
        <h1>Mentions légales</h1>
        <p class="legal-page__notice">
          Document préparatoire — les informations marquées TODO doivent être
          validées avant la mise en production.
        </p>
        <section>
          <h2>Éditeur</h2>
          <p>
            Wepost.pro est un projet applicatif. <strong>TODO :</strong> ajouter
            la raison sociale, la forme juridique, le capital, l’adresse du
            siège, le numéro d’immatriculation et le responsable de publication.
          </p>
        </section>
        <section>
          <h2>Hébergement</h2>
          <p>
            L’infrastructure cible est hébergée sur un VPS Hetzner et déployée
            avec Coolify. <strong>TODO :</strong> confirmer l’entité Hetzner
            contractante et son adresse légale.
          </p>
        </section>
        <section>
          <h2>Contact</h2>
          <p>
            <strong>TODO :</strong> renseigner l’adresse de contact officielle
            avant publication.
          </p>
        </section>
      </div>
    </main>
    <PublicFooter />
  </div>
</template>
