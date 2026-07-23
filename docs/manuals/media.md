# Manuel des médias

## Utilisation

Depuis la fiche d’une publication, un membre agence ou administrateur choisit une image/vidéo, saisit une alternative ou la marque décorative, puis lance le transfert. La validation peut prendre quelques instants. Les boutons Monter et Descendre offrent un ordre accessible sans glisser-déposer. Supprimer place le média dans la corbeille avant toute purge physique.

Le client affecté consulte les aperçus privés et leurs alternatives, sans commande de mutation.

## Configuration Cloudflare R2

Créer un bucket privé et des identifiants distincts par environnement. Configurer l’API :

```text
MEDIA_STORAGE_DRIVER=r2
MEDIA_MAX_BYTES=20971520
MEDIA_SIGNED_URL_TTL_SECONDS=300
MEDIA_ABANDONED_UPLOAD_MINUTES=60
MEDIA_AGENCY_QUOTA_BYTES=10737418240
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=wepost-staging-media
R2_ENVIRONMENT_PREFIX=staging
```

Appliquer au bucket une CORS dérivée de `infra/coolify/r2-cors.example.json` avec l’origine exacte de Nuxt. Les URLs signées sont des secrets temporaires : ne pas les journaliser, les exposer dans une capture ou les rendre publiques.

## Maintenance

Le service `cleanupAbandonedUploads` supprime les uploads `pending_upload` expirés ; son exécution périodique devra être branchée au worker BullMQ lors de la création de celui-ci. Les médias supprimés doivent respecter la politique de corbeille avant appel de la purge. Surveiller `media.quota.warning` et les événements `media.r2.*.failed`.
