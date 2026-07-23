# Manuel d’authentification

## Principe

Wepost.pro utilise le session guard officiel de `@adonisjs/auth`. Le navigateur reçoit un cookie de session `HttpOnly` et ne reçoit aucun JWT, bearer token ou refresh token. Les sessions sont conservées dans Redis en local, recette et production ; les tests Japa utilisent le store mémoire isolé.

## Parcours HTTP

| Méthode | Route                   | Accès   | Usage                                        |
| ------- | ----------------------- | ------- | -------------------------------------------- |
| GET     | `/health/live`          | public  | disponibilité du processus API               |
| GET     | `/api/v1/auth/csrf`     | public  | pose ou renouvelle le cookie XSRF            |
| POST    | `/api/v1/auth/register` | invité  | crée puis connecte un compte                 |
| POST    | `/api/v1/auth/login`    | invité  | vérifie les identifiants et ouvre la session |
| GET     | `/api/v1/auth/me`       | session | retourne le profil public courant            |
| POST    | `/api/v1/auth/logout`   | session | ferme uniquement la session courante         |

Les réponses utilisateur sont enveloppées dans `data`. Les erreurs de validation ou d’authentification utilisent `errors`. Le mot de passe n’est jamais sérialisé.

## CSRF et cookies

Avant chaque requête mutative, le client Nuxt appelle `/auth/csrf`. Shield pose `XSRF-TOKEN`, que le client retransmet dans `X-XSRF-TOKEN`. Le cookie de session reste `HttpOnly` et n’est jamais lu par JavaScript. Toutes les requêtes API sont envoyées avec `credentials: 'include'`.

En recette et production, configurer :

```text
SESSION_DRIVER=redis
SESSION_COOKIE_NAME=wepost_session_staging  # ou wepost_session
SESSION_COOKIE_DOMAIN=.wepost.pro
CORS_ORIGINS=https://app.wepost.pro
```

Le cookie est `Secure` automatiquement en production, `SameSite=Lax` et limité au chemin `/`. L’origine CORS doit être exacte ; `*` est incompatible avec les credentials.

## Exploitation

- Compte désactivé : la connexion renvoie le même message public qu’un mauvais mot de passe.
- Session expirée : `/auth/me` renvoie `401` et Nuxt redirige vers `/auth/login?reason=session-expired`.
- Rate limiting : 10 tentatives de connexion par minute, blocage 15 minutes ; 5 inscriptions par heure.
- Logs : événement, raison générique et identifiant utilisateur après succès ; jamais de mot de passe, cookie ou identifiant de session.
