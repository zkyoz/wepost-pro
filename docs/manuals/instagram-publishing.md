# Publication Instagram

## Configuration

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
