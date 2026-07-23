# Preuves — Tâche 23

## Résumé

La racine publique affiche désormais une landing SSR responsive au langage
SaaS contemporain. La même direction visuelle est appliquée aux écrans
d’authentification, à la navigation privée et au dashboard, sans remplacer les
données réelles par des valeurs de démonstration.

## Fichiers structurants

- `apps/web/app/pages/index.vue` ;
- `apps/web/app/pages/dashboard.vue` ;
- `apps/web/app/components/AppIcon.vue` ;
- `apps/web/app/components/AppNavigation.vue` ;
- `apps/web/app/components/AuthShell.vue` ;
- `apps/web/app/components/PrivateShell.vue` ;
- `apps/web/app/components/PublicHeader.vue` ;
- `apps/web/app/components/PublicFooter.vue` ;
- `apps/web/app/assets/css/main.css` ;
- `apps/web/app/components/AnalyticsConsent.vue` ;
- `apps/web/app/composables/useAnalyticsConsent.ts` ;
- `apps/web/server/middleware/public-security.ts` ;
- `apps/web/server/routes/robots.txt.ts` ;
- `apps/web/server/routes/sitemap.xml.ts` ;
- `apps/web/e2e/landing.spec.ts`.

## Conception visuelle

Les concepts one-shot conservés avec le dépôt sont :

1. `docs/design/wepost-landing-hero-concept.png` ;
2. `docs/design/wepost-landing-middle-concept.png` ;
3. `docs/design/wepost-landing-final-concept.png` ;
4. `docs/design/wepost-dashboard-concept.png` ;
5. `docs/design/wepost-auth-concept.png`.

L’implémentation conserve cinq marqueurs vérifiés sur la capture finale :

- palette de marque exacte `#F2590D`, `#2F343A`, `#000000` et `#BBD9F1` ;
- typographie éditoriale forte, grands espaces et bordures fines ;
- hero avec aperçu produit codé en HTML/CSS et CTA visible sans défilement ;
- navigation privée structurée, dashboard compact et cartes orientées action ;
- FAQ native, CTA sombre et footer légal.

Écarts assumés : aucun visuel raster n’est chargé en production ; l’aperçu est
du HTML sémantiquement neutralisé avec un nom accessible. Le texte final a été
resserré pour ne présenter ni faux chiffre ni promesse non vérifiée.

Les captures finales ont été produites par Playwright Chromium en page entière,
à 1280 px desktop et 360 CSS px mobile, puis inspectées visuellement :

- `docs/evidence/task23/screenshots/landing-desktop.png` ;
- `docs/evidence/task23/screenshots/landing-mobile.png`.

## Tests locaux

| Contrôle              | Résultat mesuré                                                   |
| --------------------- | ----------------------------------------------------------------- |
| Tests web             | 100/100                                                           |
| Tests ciblés Task 23  | 5/5                                                               |
| Couverture web        | lignes 83,47 %, branches 76,92 %, fonctions 78,60 %               |
| E2E Task 23           | 6/6 desktop/mobile, dont reflow 320 px                            |
| E2E session et locale | 2/2 desktop/mobile après rechargement                             |
| Accessibilité E2E     | aucune violation axe sérieuse ou critique                         |
| TypeScript            | vert                                                              |
| Build Nuxt SSR        | vert, 10 routes/charges pré-rendues                               |
| Lighthouse            | performance 100, accessibilité 100, bonnes pratiques 100, SEO 100 |

Rapports Lighthouse archivés :

- `docs/evidence/task23/lighthouse.report.html` ;
- `docs/evidence/task23/lighthouse.report.json`.

Mesures associées : FCP 1,1 s, LCP 1,2 s et CLS 0 sous le profil mobile
throttlé de Lighthouse. Sans clé analytics, la route pré-rendue ne charge aucun
JavaScript applicatif ; si PostHog est configuré, Nuxt réactive les scripts pour
présenter et mémoriser le consentement.

## Migrations

Aucune migration : la tâche ne crée aucune donnée métier.

## Limites et preuves manuelles

- validation juridique des trois pages publiques ;
- définition du domaine canonique de production ;
- clé PostHog EU et contrôle réseau avant/après consentement ;
- audit RGAA manuel, zoom 200 % et lecteur d’écran ;
- nouvelle mesure Lighthouse après activation réelle et consentie de PostHog ;
- recette Coolify de préproduction et SHA Git.
