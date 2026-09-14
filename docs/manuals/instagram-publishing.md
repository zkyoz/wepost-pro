# Publication Instagram

## Configuration

### Démonstration locale sans Page Facebook

Le worker prend aussi en charge **Instagram Login** : `INSTAGRAM_LOGIN_MODE=instagram`,
API `graph.instagram.com`, token utilisateur autorisé pour le compte professionnel.
Le bouton de connexion Facebook Login n’est pas utilisé dans ce mode.

1. Conserver le token et le nom attendu du compte dans `.demo/instagram.env`
   (`INSTAGRAM_ACCESS_TOKEN` et `INSTAGRAM_USERNAME`, fichier privé 0600, jamais Git).
2. Après compilation de l’API : `pnpm demo:instagram:connect`. La commande vérifie
   l’identité et l’accès au quota, puis chiffre le token pour l’agence locale.
3. Placer le seul JPEG autorisé dans `.demo/instagram-test.jpg`, puis lancer
   `pnpm demo:instagram:image`. Le serveur écoute sur `127.0.0.1:4445` et expire
   après 30 minutes. Le chemin opaque et le SHA256 sont dans `.demo/image-bridge.json`.
4. Lancer `cloudflared tunnel --url http://127.0.0.1:4445 --no-autoupdate`.
   Ne jamais cibler le frontend, l’API ou un répertoire de fichiers.
5. Dans `.demo/instagram-public.env`, renseigner `INSTAGRAM_DEMO_IMAGE_URL`
   (origine HTTPS affichée par le tunnel + chemin opaque) et
   `INSTAGRAM_DEMO_IMAGE_SHA256` (empreinte du manifeste).
6. Lancer `pnpm demo:social:start`, qui conserve LinkedIn réel. Créer le post dans
   WePost, téléverser ce même JPEG, obtenir l’approbation, valider puis programmer.
7. Actualiser le statut et vérifier le post sur Instagram. Arrêter le serveur
   d’image et le tunnel. Recréer le lien pour un nouveau test ; ne pas réutiliser
   un lien expiré et ne pas réexécuter une publication déjà réussie.

Ce pont est réservé au test local, sans garantie de disponibilité. La vidéo et
la production n’ont pas été validées par ce scénario. Les scopes et l’expiration
absents de la réponse Meta sont indiqués comme non fournis, pas inventés.

Références : [publication Instagram officielle](https://developers.facebook.com/documentation/instagram-platform/content-publishing),
[Quick Tunnels Cloudflare](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/).

### Facebook Login / infrastructure durable

Créer/configurer l’application Meta retenue pour **Instagram API with Facebook Login** et déclarer exactement le callback de chaque environnement. Le compte Instagram doit être professionnel (Business ou Creator), lié à une Page Facebook gérée par l’utilisateur OAuth.

```text
SOCIAL_TOKEN_ENCRYPTION_KEY=<32 octets en base64>
INSTAGRAM_API_DRIVER=instagram
INSTAGRAM_APP_ID=<secret Coolify>
INSTAGRAM_APP_SECRET=<secret Coolify>
INSTAGRAM_GRAPH_API_VERSION=<version active validée dans Meta>
INSTAGRAM_OAUTH_REDIRECT_URI=https://api.wepost.pro/api/v1/social/instagram/oauth/callback
INSTAGRAM_OAUTH_SUCCESS_URL=https://app.wepost.pro/settings/instagram
```

Fournir au worker la même clé de chiffrement, le secret d’application, la version Graph et les accès R2 privés. Nuxt ne reçoit aucun de ces secrets. Les permissions demandées sont `pages_show_list`, `pages_read_engagement`, `instagram_basic` et `instagram_content_publish`. Leur disponibilité et l’App Review doivent être vérifiées dans l’application Meta réelle. La version Graph reste volontairement configurable : remplacer `TODO_SET_FROM_META_APP_DASHBOARD` avant d’activer le driver réel.

## Périmètre livré

- une image JPEG par publication ;
- ou une vidéo MP4 publiée comme Reel ;
- légende issue du texte approuvé ;
- création du conteneur, attente de `FINISHED`, puis appel `media_publish` ;
- médias R2 privés exposés à Meta par URL signée durant 20 minutes ;
- idempotence interne par publication, réseau, version et compte.

Les carrousels, Stories, images PNG/GIF et comptes personnels sont hors périmètre de cette version. Il faut revalider les formats, dimensions, durées et limites courantes dans la documentation Meta avant la recette réelle.

## Utilisation

1. ouvrir **Instagram** avec un compte admin/agence ;
2. saisir l’identifiant du compte professionnel et terminer le flux Meta ;
3. vérifier le compte, les permissions et l’expiration sans afficher le token ;
4. approuver une publication ciblant Instagram et lui associer exactement un JPEG ou MP4 validé ;
5. lancer **Valider pour Instagram**, choisir la date puis programmer ;
6. consulter le statut et les tentatives ; corriger puis relancer un échec définitif ;
7. déconnecter l’intégration localement et retirer l’application dans Meta si nécessaire.

## Exploitation

Le worker doit tourner comme service Coolify séparé. Superviser les événements `social.instagram_*`, la durée, les retries et les statuts PostgreSQL. Configurer une alerte si le taux d’échec Instagram dépasse 5 % sur 24 h. Une permission retirée ou un token expiré exige une reconnexion explicite.

Références officielles à revalider lors de la configuration : [publication de contenu Instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/content-publishing/), [création d’un conteneur média](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media) et [état d’un conteneur](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-container).
