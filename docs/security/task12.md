# Sécurité — Tâche 12

Les routes TikTok utilisent session, CSRF, permissions centralisées et portée agence/projet. Le client affecté ne peut que consulter le statut. OAuth utilise un `state` aléatoire chiffré, lié à l’acteur et consommable une fois ; les scopes sont limités à `user.info.basic` et `video.publish`. Le flux web confidentiel officiel retenu ne fournit pas de mécanisme PKCE documenté ; ce point devra être réévalué si TikTok le rend disponible. Access/refresh tokens sont chiffrés AES-256-GCM, jamais sérialisés ni journalisés, et la révocation distante précède l’effacement local.

Le worker charge la vidéo privée depuis R2 et n’accepte l’URL d’upload temporaire que sur un sous-domaine HTTPS `tiktokapis.com`, ce qui limite le risque SSRF. Avant tout appel il vérifie version approuvée, compte, expiration, MP4 et empreinte du payload/média. Le `publish_id` est persisté avant interrogation du statut afin qu’un retry ne réinitialise pas le post. Timeout, 429, 5xx et traitement pending sont transitoires ; token, permission, contenu et `FAILED` sont définitifs.

Les tests couvrent OAuth/state, IDOR, chiffrement, validation, expiration, empreinte, hôte d’upload, pending→published, échec distant, retries et reprise idempotente. Aucun appel TikTok réel n’est effectué en CI.
