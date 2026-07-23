# Publication Facebook

## Configuration

Créer une application Meta et configurer le produit Facebook Login avec l’URI exacte du callback. Renseigner séparément par environnement :

```text
SOCIAL_TOKEN_ENCRYPTION_KEY=<32 octets en base64>
FACEBOOK_API_DRIVER=facebook
FACEBOOK_APP_ID=<secret Coolify>
FACEBOOK_APP_SECRET=<secret Coolify>
FACEBOOK_GRAPH_API_VERSION=<version active validée dans Meta>
FACEBOOK_OAUTH_REDIRECT_URI=https://api.wepost.pro/api/v1/social/facebook/oauth/callback
FACEBOOK_OAUTH_SUCCESS_URL=https://app.wepost.pro/settings/facebook
```

Fournir au worker la même clé de chiffrement, le secret d’application, la version Graph et les variables R2 privées. Ne jamais injecter ces valeurs dans Nuxt. Le driver `mock` est réservé aux tests et au développement isolé.

Les permissions demandées sont `pages_show_list`, `pages_read_engagement` et `pages_manage_posts`. Leur disponibilité et l’App Review doivent être confirmées dans l’application Meta réelle. La version Graph n’est volontairement pas figée : la valeur `TODO_SET_FROM_META_APP_DASHBOARD` empêche un démarrage réel accidentel.

## Utilisation

1. ouvrir **Facebook** avec un compte admin/agence ;
2. saisir l’identifiant de la Page à administrer et poursuivre le flux Meta ;
3. vérifier le nom, l’identifiant, les scopes et l’expiration sans afficher le token ;
4. approuver la version de publication, puis lancer **Valider pour Facebook** ;
5. choisir la date et programmer ;
6. consulter le statut et l’historique ; corriger puis relancer uniquement un échec définitif ;
7. révoquer l’intégration localement et, si nécessaire, retirer aussi l’application dans les réglages Meta.

Texte, JPEG, PNG, GIF et une vidéo MP4 sont préparés. Une vidéo ne peut pas être mélangée avec d’autres médias dans cette version.

## Exploitation

Le worker doit tourner comme service Coolify séparé. Superviser les événements structurés `social.facebook_*`, la durée des jobs, les tentatives et les statuts PostgreSQL. Configurer dans l’outil de monitoring une alerte si le taux d’échec Facebook dépasse 5 % sur 24 h. En cas d’expiration ou de permission retirée, reconnecter la Page ; ne pas modifier les tokens en base.

Références officielles à revalider lors de la configuration : [flux Facebook Login](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/), [publication des Pages](https://developers.facebook.com/docs/pages-api/posts/), [endpoint Page `feed`](https://developers.facebook.com/docs/graph-api/reference/page/feed) et [permission `pages_manage_posts`](https://developers.facebook.com/docs/permissions#reference-pages_manage_posts).
