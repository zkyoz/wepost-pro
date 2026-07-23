<script setup lang="ts">
useSeoMeta({
  title: "Accessibilité",
  description: "Démarche d’accessibilité de Wepost.pro.",
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
        <h1>Accessibilité</h1>
        <p class="legal-page__notice">
          État de conformité : non déterminé. Aucun audit RGAA complet n’a
          encore été réalisé ; aucune conformité totale n’est revendiquée.
        </p>
        <section>
          <h2>Démarche</h2>
          <p>
            Wepost.pro vise le RGAA 4.1.2. Les composants sont conçus avec du
            HTML sémantique, une navigation clavier, des focus visibles, des
            alternatives textuelles et un reflow à 320 px.
          </p>
        </section>
        <section>
          <h2>Contrôles à finaliser</h2>
          <p>
            Les tests automatisés ne remplacent pas un audit manuel. Les
            vérifications avec NVDA ou VoiceOver et la déclaration
            d’accessibilité définitive restent à produire.
          </p>
        </section>
        <section>
          <h2>Signaler une difficulté</h2>
          <p>
            <strong>TODO :</strong> ajouter le canal de contact accessibilité et
            la voie de recours avant la mise en production.
          </p>
        </section>
      </div>
    </main>
    <PublicFooter />
  </div>
</template>
