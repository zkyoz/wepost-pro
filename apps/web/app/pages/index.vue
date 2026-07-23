<script setup lang="ts">
import { buildCanonicalUrl, landingSeoMeta } from "~/utils/public-seo";

const config = useRuntimeConfig();
const canonicalUrl = buildCanonicalUrl(String(config.public.siteUrl));

const features = [
  {
    number: "01",
    title: "Un calendrier partagé",
    text: "Retrouvez les publications par projet, réseau, statut et période dans une vue commune.",
  },
  {
    number: "02",
    title: "Des validations traçables",
    text: "Commentaires, demandes de correction et approbations restent rattachés à la bonne version.",
  },
  {
    number: "03",
    title: "Une publication orchestrée",
    text: "Programmez les contenus approuvés et suivez chaque tentative sans perdre l’historique.",
  },
  {
    number: "04",
    title: "Une vision agence",
    text: "Identifiez ce qui attend une action et mesurez le fonctionnement réel de vos projets.",
  },
];

const workflow = [
  [
    "Préparer",
    "L’agence rassemble le texte, les médias et les réseaux ciblés.",
  ],
  ["Partager", "Le client consulte la publication dans son projet."],
  ["Valider", "Les retours et l’approbation sont liés à une version précise."],
  ["Programmer", "L’agence choisit la date et suit la publication."],
];

const networks = ["Facebook", "Instagram", "LinkedIn", "Pinterest", "TikTok"];
const networkIcons = [
  "facebook",
  "instagram",
  "linkedin",
  "pinterest",
  "tiktok",
];
const workflowIcons = ["folder", "message", "check", "calendar"];

useSeoMeta({
  ...landingSeoMeta,
  ogUrl: canonicalUrl,
});

useHead({
  link: [{ rel: "canonical", href: canonicalUrl }],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Wepost.pro",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: canonicalUrl,
        description:
          "Workflow éditorial partagé pour les agences de communication et leurs clients.",
      }),
    },
  ],
});
</script>

<template>
  <div class="public-page">
    <PublicHeader />

    <main id="main-content">
      <section class="public-hero" aria-labelledby="hero-title">
        <div class="public-container public-hero__grid">
          <div class="public-hero__copy">
            <h1 id="hero-title">
              Planifiez, validez et publiez
              <span>au même endroit.</span>
            </h1>
            <p>
              Wepost.pro réunit l’agence et ses clients autour d’un calendrier
              éditorial clair, de retours traçables et d’un suivi de publication
              partagé.
            </p>
            <div class="public-actions">
              <NuxtLink class="public-button" to="/auth/login">
                Se connecter
              </NuxtLink>
              <a class="public-text-link" href="#workflow">
                Découvrir le workflow
              </a>
            </div>
          </div>

          <div
            class="product-preview"
            role="img"
            aria-label="Aperçu d’un calendrier éditorial avec une publication en attente de validation client"
          >
            <div class="product-preview__rail" aria-hidden="true">
              <span class="product-preview__mark">w.</span>
              <AppIcon name="calendar" :size="18" />
              <AppIcon name="message" :size="18" />
              <AppIcon name="folder" :size="18" />
              <AppIcon name="chart" :size="18" />
            </div>
            <div class="product-preview__main">
              <div class="product-preview__top">
                <span>Calendrier éditorial</span>
                <span>Juillet 2026 · Mois</span>
              </div>
              <div class="product-preview__body">
                <div class="product-preview__days" aria-hidden="true">
                  <span>Lun</span><span>Mar</span><span>Mer</span
                  ><span>Jeu</span><span>Ven</span>
                </div>
                <div class="product-preview__calendar" aria-hidden="true">
                  <span></span><span></span><span></span><span></span
                  ><span></span> <span></span
                  ><span class="preview-post">Lancement produit</span
                  ><span></span
                  ><span class="preview-post preview-post--blue"
                    >Conseil du jour</span
                  ><span></span>
                </div>
                <div class="review-card">
                  <p>Validation client</p>
                  <strong>Publication LinkedIn</strong>
                  <span>Version 3 · en attente</span>
                  <div class="review-card__tabs">
                    <span>Aperçu</span>
                    <span>Commentaires · 2</span>
                  </div>
                  <div class="review-card__actions">
                    <span>Demander une modification</span>
                    <span>Approuver</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="public-problem" aria-labelledby="problem-title">
        <div class="public-container public-problem__grid">
          <div>
            <h2 id="problem-title">Le contenu se disperse vite.</h2>
            <p>
              E-mails, messageries, fichiers partagés et outils natifs rendent
              les versions difficiles à suivre.
            </p>
            <div class="problem-scatter" aria-hidden="true">
              <span>E-mail · Re: publication</span>
              <span>Planning_v3.xlsx</span>
              <span>Peux-tu valider ?</span>
              <span>Visuel_final-2.png</span>
            </div>
          </div>
          <div>
            <h2>Le workflow, lui, reste lisible.</h2>
            <p>
              Une publication, une version courante, des décisions datées et un
              statut compris par chaque intervenant.
            </p>
            <ol class="problem-flow" aria-hidden="true">
              <li><AppIcon name="folder" :size="18" /> Contenu centralisé</li>
              <li><AppIcon name="message" :size="18" /> Retours tracés</li>
              <li><AppIcon name="check" :size="18" /> Version approuvée</li>
            </ol>
          </div>
        </div>
      </section>

      <section
        id="fonctionnalites"
        class="public-section"
        aria-labelledby="features-title"
      >
        <div class="public-container">
          <div class="public-section__intro">
            <h2 id="features-title">
              Tout le cycle éditorial, sans faux détour.
            </h2>
            <p>
              Les fonctions essentielles sont reliées par les mêmes projets,
              utilisateurs et règles d’autorisation.
            </p>
          </div>
          <div class="feature-showcase">
            <div class="feature-timeline" aria-hidden="true">
              <div class="feature-timeline__top">
                <strong>Lancement produit</strong>
                <span>Version 3 · Approuvée</span>
              </div>
              <ol>
                <li>
                  <time>09:15</time>
                  <span>Publication créée par Camille</span>
                </li>
                <li>
                  <time>10:40</time>
                  <span>Contenu et médias ajoutés</span>
                </li>
                <li>
                  <time>11:20</time>
                  <span>Commentaire client reçu</span>
                </li>
                <li>
                  <time>12:05</time>
                  <span>Version approuvée</span>
                </li>
                <li>
                  <time>12:30</time>
                  <span>Publication programmée</span>
                </li>
              </ol>
            </div>
            <ol class="feature-grid">
              <li v-for="feature in features" :key="feature.number">
                <span aria-hidden="true">{{ feature.number }}</span>
                <div>
                  <h3>{{ feature.title }}</h3>
                  <p>{{ feature.text }}</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section
        id="workflow"
        class="public-section public-section--navy"
        aria-labelledby="workflow-title"
      >
        <div class="public-container">
          <div class="public-section__intro">
            <h2 id="workflow-title">Un passage de relais explicite.</h2>
            <p>
              L’agence garde la maîtrise de la production. Le client intervient
              au bon moment, sur le bon contenu.
            </p>
          </div>
          <ol class="workflow-list">
            <li v-for="(step, index) in workflow" :key="step[0]">
              <span aria-hidden="true">{{ index + 1 }}</span>
              <span class="workflow-list__icon" aria-hidden="true">
                <AppIcon :name="workflowIcons[index] ?? 'check'" :size="26" />
              </span>
              <h3>{{ step[0] }}</h3>
              <p>{{ step[1] }}</p>
            </li>
          </ol>
        </div>
      </section>

      <section class="network-strip" aria-labelledby="networks-title">
        <div class="public-container network-strip__inner">
          <h2 id="networks-title">Réseaux pris en charge</h2>
          <ul>
            <li v-for="(network, index) in networks" :key="network">
              <AppIcon :name="networkIcons[index] ?? 'check'" :size="22" />
              {{ network }}
            </li>
          </ul>
        </div>
      </section>

      <section
        id="securite"
        class="public-section"
        aria-labelledby="security-title"
      >
        <div class="public-container security-grid">
          <div class="security-copy">
            <h2 id="security-title">
              La collaboration n’efface pas les frontières.
            </h2>
            <p>
              Les droits sont vérifiés côté serveur. Chaque client reste limité
              à ses projets et les connexions sociales ne révèlent jamais leurs
              secrets dans l’interface.
            </p>
            <ul>
              <li>
                <AppIcon name="admin" :size="22" />
                <span>
                  <strong>Accès par rôle</strong>
                  Administrateur, agence et client disposent de périmètres
                  distincts.
                </span>
              </li>
              <li>
                <AppIcon name="check" :size="22" />
                <span>
                  <strong>Décisions versionnées</strong>
                  Une modification invalide l’approbation devenue obsolète.
                </span>
              </li>
              <li>
                <AppIcon name="chart" :size="22" />
                <span>
                  <strong>Traçabilité</strong>
                  Les actions sensibles et les tentatives sont journalisées.
                </span>
              </li>
            </ul>
          </div>
          <div
            class="security-preview"
            role="img"
            aria-label="Aperçu des permissions selon les rôles administrateur, agence et client"
          >
            <div class="security-preview__header">
              <span>Équipe & rôles</span>
              <span>Permissions</span>
            </div>
            <div class="security-preview__row">
              <span class="security-preview__avatar">A</span>
              <div>
                <strong>Administrateur</strong>
                <small>Supervision globale</small>
              </div>
              <span>Gérer</span>
            </div>
            <div class="security-preview__row">
              <span class="security-preview__avatar">AG</span>
              <div>
                <strong>Agence</strong>
                <small>Créer, valider, programmer</small>
              </div>
              <span>Modifier</span>
            </div>
            <div class="security-preview__row">
              <span class="security-preview__avatar">C</span>
              <div>
                <strong>Client</strong>
                <small>Consulter, commenter, approuver</small>
              </div>
              <span>Consulter</span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="faq"
        class="public-section public-section--soft"
        aria-labelledby="faq-title"
      >
        <div class="public-container faq-grid">
          <div>
            <h2 id="faq-title">Questions fréquentes</h2>
            <p>
              Les réponses essentielles avant d’entrer dans l’espace de travail.
            </p>
          </div>
          <div class="faq-list">
            <details>
              <summary>À qui s’adresse Wepost.pro ?</summary>
              <p>
                À une agence de communication et aux clients qu’elle invite sur
                leurs projets.
              </p>
            </details>
            <details>
              <summary>Un client peut-il publier directement ?</summary>
              <p>
                Non. Il consulte, commente et valide. La programmation et la
                publication restent sous le contrôle de l’agence.
              </p>
            </details>
            <details>
              <summary>
                Les publications sont-elles envoyées sans validation ?
              </summary>
              <p>
                Non. Seule une version approuvée peut entrer dans le cycle de
                programmation.
              </p>
            </details>
            <details>
              <summary>Quels réseaux sont intégrés ?</summary>
              <p>
                Facebook, Instagram, LinkedIn, Pinterest et TikTok sont prévus
                dans le workflow de publication.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section class="public-cta" aria-labelledby="cta-title">
        <div class="public-container">
          <h2 id="cta-title">
            Passez d’un contenu dispersé à un
            <span>workflow partagé.</span>
          </h2>
          <p>
            Planifiez, validez et ajustez ensemble dans un espace clair et
            traçable.
          </p>
          <NuxtLink class="public-button" to="/auth/login">
            Se connecter
          </NuxtLink>
        </div>
      </section>
    </main>

    <PublicFooter />
    <AnalyticsConsent />
  </div>
</template>
