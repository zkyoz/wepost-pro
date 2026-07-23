# Publication Pinterest

## Configuration

Créer une application Pinterest, déclarer exactement le callback de chaque environnement et demander les scopes nécessaires au compte et aux Pins.

```text
SOCIAL_TOKEN_ENCRYPTION_KEY=<32 octets en base64>
PINTEREST_API_DRIVER=pinterest
PINTEREST_APP_ID=<secret Coolify>
PINTEREST_APP_SECRET=<secret Coolify>
PINTEREST_API_BASE_URL=https://api.pinterest.com/v5
PINTEREST_OAUTH_REDIRECT_URI=https://api.wepost.pro/api/v1/social/pinterest/oauth/callback
PINTEREST_OAUTH_SUCCESS_URL=https://app.wepost.pro/settings/pinterest
```

Fournir au worker la même clé de chiffrement, le driver, l’URL API et les accès R2 privés. Nuxt ne reçoit aucun secret. Le sandbox officiel utilise `https://api-sandbox.pinterest.com/v5` ; le driver `mock` reste réservé aux tests.

## Périmètre livré

- choix d’un tableau accessible au compte OAuth ;
- Pin avec titre, description, lien HTTP(S) facultatif et une image JPEG/PNG privée ;
- idempotence interne par publication, réseau, version et compte ;
- renouvellement continu via refresh token lorsqu’il est fourni.

Vidéos, carrousels, Idea Pins, publicités et création avancée de tableaux sont hors périmètre.

## Utilisation

1. ouvrir **Pinterest** avec un compte admin/agence et terminer OAuth ;
2. vérifier compte, scopes, tableaux et expiration sans afficher de token ;
3. approuver une publication ciblant Pinterest avec exactement une image propre ;
4. choisir compte et tableau, vérifier titre/description/lien, puis valider ;
5. choisir éventuellement la date et programmer ;
6. consulter statut/tentatives, corriger puis relancer un échec définitif ;
7. renouveler l’accès avant expiration, ou reconnecter ;
8. déconnecter localement puis révoquer l’application côté Pinterest si nécessaire.

## Exploitation

Superviser les événements `social.pinterest_*`, la durée, les retries et les statuts PostgreSQL, puis configurer l’alerte d’échec > 5 % sur 24 h.

Références officielles : [authentification et autorisation](https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/), [création de tableaux et Pins](https://developers.pinterest.com/docs/work-with-organic-content-and-users/create-boards-and-pins/) et [endpoint Create Pin](https://developers.pinterest.com/docs/api/v5/pins-create/).
