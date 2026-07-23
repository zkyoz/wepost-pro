<script setup lang="ts">
useSeoMeta({
  title: "Politique de confidentialité",
  description: "Principes de confidentialité appliqués par Wepost.pro.",
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
        <h1>Politique de confidentialité</h1>
        <p class="legal-page__notice">
          Version préparatoire à faire valider juridiquement avant la mise en
          production.
        </p>
        <section>
          <h2>Données traitées</h2>
          <p>
            Le service traite les données de compte, les contenus éditoriaux,
            les validations et les journaux nécessaires à la sécurité et à la
            traçabilité. Les mots de passe ne sont jamais stockés en clair.
          </p>
        </section>
        <section>
          <h2>Mesure d’audience</h2>
          <p>
            Lorsque PostHog Cloud EU est configuré, il n’est initialisé qu’après
            un consentement explicite. Le refus ne bloque pas l’accès au site.
            Le choix est conservé dans le navigateur.
          </p>
        </section>
        <section>
          <h2>Durées et droits</h2>
          <p>
            Les durées définitives et le point de contact pour exercer les
            droits d’accès, de rectification, d’effacement et d’opposition sont
            à confirmer. <strong>TODO :</strong> validation RGPD et coordonnées
            du responsable de traitement.
          </p>
        </section>
      </div>
    </main>
    <PublicFooter />
  </div>
</template>
