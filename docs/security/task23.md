# Sécurité — Tâche 23

## Mesures implémentées

- en-têtes `Content-Security-Policy`, `frame-ancestors`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy` et `Cross-Origin-Opener-Policy` en
  production ;
- sources CSP limitées au site et, pour `connect-src`, à l’origine PostHog
  configurée ;
- aucune donnée privée ni secret dans le HTML public ;
- aucune collecte PostHog sans clé de configuration et consentement explicite ;
- refus du suivi sans blocage de la navigation ;
- pages privées exclues du sitemap et signalées dans `robots.txt` ;
- aucune saisie publique et donc aucune surface de formulaire de contact.

La CSP n’est pas injectée par le middleware en mode développement afin de ne
pas bloquer le serveur HMR Nuxt. Elle est présente dans le build de production.

## Variables

```text
NUXT_PUBLIC_SITE_URL
NUXT_PUBLIC_POSTHOG_KEY
NUXT_PUBLIC_POSTHOG_HOST
```

`NUXT_PUBLIC_POSTHOG_KEY` reste vide par défaut. Aucune valeur réelle n’est
commise. Dans ce mode, la landing pré-rendue est livrée sans JavaScript
applicatif. La présence d’une clé réactive l’hydratation afin d’afficher le
choix de consentement avant toute initialisation PostHog.

## Limites

- la politique doit être vérifiée sur le domaine final et adaptée uniquement si
  un service réellement retenu le nécessite ;
- les mentions légales et la politique de confidentialité sont préparatoires ;
- un contrôle réseau en préproduction doit confirmer l’absence de requête
  PostHog avant consentement.
