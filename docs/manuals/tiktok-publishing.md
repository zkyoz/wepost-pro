# Publication TikTok

## Configuration

Créer une application TikTok, activer Content Posting API et déclarer exactement le callback de chaque environnement.

```text
SOCIAL_TOKEN_ENCRYPTION_KEY=<32 octets en base64>
TIKTOK_API_DRIVER=tiktok
TIKTOK_CLIENT_KEY=<secret Coolify>
TIKTOK_CLIENT_SECRET=<secret Coolify>
TIKTOK_API_BASE_URL=https://open.tiktokapis.com
TIKTOK_OAUTH_REDIRECT_URI=https://api.wepost.pro/api/v1/social/tiktok/oauth/callback
TIKTOK_OAUTH_SUCCESS_URL=https://app.wepost.pro/settings/tiktok
```

Le worker reçoit le driver, l’URL API, la clé de chiffrement et les accès R2. Le frontend ne reçoit aucun secret. `mock` est réservé aux tests.

## Périmètre livré

Wepost interroge les options du créateur, demande une confirmation explicite, initialise un Direct Post en `FILE_UPLOAD`, transfère une vidéo MP4 privée puis suit le `publish_id`. Le statut local ne devient `published` qu’après `PUBLISH_COMPLETE`. En cas de traitement encore en cours, BullMQ reprend le même `publish_id` avec les délais 1/5/15 minutes.

Cette version accepte un unique MP4, sans montage. Les codecs, dimensions, fréquence et durée définitifs restent validés par TikTok. Une application non auditée peut être limitée à `SELF_ONLY`.

## Exploitation

Superviser `social.tiktok_*`, `provider_status`, durée et retries. Un statut `FAILED` doit être corrigé puis relancé ; la relance efface le job distant échoué avant une nouvelle initialisation. Configurer une alerte si le taux d’échec dépasse 5 % sur 24 h.

Références officielles : [OAuth et tokens](https://developers.tiktok.com/doc/oauth-user-access-token-management), [Direct Post](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post), [capacités du créateur](https://developers.tiktok.com/doc/content-posting-api-reference-query-creator-info), [transfert vidéo](https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide) et [statut distant](https://developers.tiktok.com/doc/content-posting-api-reference-get-video-status).
