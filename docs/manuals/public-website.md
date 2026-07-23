# Site public Wepost.pro

## Routes

- `/` : landing page ;
- `/mentions-legales` ;
- `/confidentialite` ;
- `/accessibilite` ;
- `/robots.txt` ;
- `/sitemap.xml`.

Le CTA public mène vers `/auth/login`. La landing n’utilise aucun middleware
d’authentification.

## Configuration

```dotenv
NUXT_PUBLIC_SITE_URL=https://wepost.pro
NUXT_PUBLIC_POSTHOG_KEY=
NUXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

La clé PostHog doit rester vide tant que le projet n’a pas validé la mesure
d’audience. Une fois configurée, la bannière permet d’accepter ou refuser ; le
module analytics n’est initialisé qu’après acceptation. Sans clé, la landing
pré-rendue est servie sans JavaScript applicatif pour réduire son coût de
chargement.

## Avant mise en production

1. remplacer tous les `TODO` des pages légales par des valeurs validées ;
2. renseigner le domaine canonique ;
3. exécuter l’audit RGAA manuel et Lighthouse ;
4. vérifier la CSP dans les réponses de production ;
5. contrôler les requêtes réseau avant et après le consentement ;
6. joindre les captures et le SHA de la recette.
