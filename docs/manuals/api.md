# Manuel de l’API REST

## Contrat et version

L’API métier Wepost.pro est une API REST AdonisJS. Les routes applicatives sont
versionnées sous `/api/v1`. Les endpoints de santé et de documentation ne sont
pas versionnés :

```text
GET /health/live
GET /health/ready
GET /api/docs
GET /api/openapi.json
```

La spécification OpenAPI 3.1 est générée depuis le routeur réellement chargé par
AdonisJS. Chaque opération expose :

- sa méthode et son chemin ;
- son nom de route Adonis ;
- son contrôleur ;
- la nécessité d’une session ;
- la permission applicative requise ;
- ses paramètres de chemin et de requête ;
- son corps JSON lorsqu’un schéma public est défini ;
- les réponses de succès et d’erreur communes.

Le catalogue complet des endpoints est disponible dans
[`docs/api/endpoints.md`](../api/endpoints.md).

## Authentification par session

L’API ne renvoie aucun JWT. Le navigateur conserve un cookie de session
`HttpOnly` créé par le session guard officiel AdonisJS.

Le nom du cookie dépend de `SESSION_COOKIE_NAME`. La spécification utilise le nom
de production `wepost_session` uniquement pour représenter le mécanisme
OpenAPI.

Les appels du frontend doivent envoyer les cookies :

```ts
await $fetch("/api/v1/auth/me", {
  credentials: "include",
});
```

## Protection CSRF

Avant une première requête `POST`, `PUT`, `PATCH` ou `DELETE`, le client appelle :

```http
GET /api/v1/auth/csrf
```

AdonisJS dépose alors le cookie lisible `XSRF-TOKEN`. Le client renvoie sa valeur
décodée dans l’en-tête :

```http
X-XSRF-TOKEN: valeur-du-cookie
```

Le cookie de session ne doit jamais être lu par JavaScript. L’endpoint interne
d’upload local signé est la seule exclusion CSRF déclarée.

## Autorisations

La présence d’une session ne suffit pas. Les permissions sont contrôlées côté
serveur avec une stratégie `deny-by-default`.

Principales permissions documentées :

| Permission            | Usage                                                 |
| --------------------- | ----------------------------------------------------- |
| `projects.read`       | Lecture des projets, publications et médias autorisés |
| `projects.manage`     | Création et modification du contenu agence            |
| `projects.review`     | Commentaires et décisions client                      |
| `social.manage`       | OAuth et programmation des réseaux                    |
| `supervision.read`    | Tableau de supervision agence                         |
| `statistics.read`     | Statistiques et exports                               |
| `calendar.export`     | Export et abonnements ICS                             |
| `ai.generate`         | Générations et variantes IA                           |
| `translations.manage` | Traductions de publication                            |
| `users.manage`        | Administration globale                                |

L’isolation par agence, projet et affectation client reste appliquée dans les
services et contrôleurs même lorsqu’une permission générale est accordée.

## Format des réponses

Une ressource est généralement enveloppée dans `data` :

```json
{
  "data": {
    "id": "72b5061d-a976-46fd-bf7d-031819b60f14",
    "name": "Projet exemple"
  }
}
```

Une liste paginée ajoute `meta` :

```json
{
  "data": [],
  "meta": {
    "currentPage": 1,
    "perPage": 12,
    "total": 0,
    "lastPage": 1
  }
}
```

Les erreurs publiques utilisent un tableau `errors`. Aucune réponse ne doit
contenir un mot de passe, un cookie, un identifiant de session ou un token
OAuth :

```json
{
  "errors": [
    {
      "field": "email",
      "message": "La valeur est invalide."
    }
  ]
}
```

Codes courants :

|        Code | Signification                                                     |
| ----------: | ----------------------------------------------------------------- |
| 200/201/204 | Succès                                                            |
|         401 | Session absente, expirée ou compte désactivé                      |
|         403 | Permission insuffisante                                           |
|         404 | Ressource absente ou volontairement masquée pour éviter une fuite |
|         409 | Conflit de version ou transition métier invalide                  |
|         422 | Validation VineJS ou règle métier invalide                        |
|         429 | Limite de requêtes atteinte                                       |
|         500 | Erreur interne expurgée                                           |

## Exemple de connexion

Les exemples ci-dessous utilisent un fichier de cookies temporaire. Aucune
valeur réelle ne doit être enregistrée dans la documentation ou dans Git.

```bash
curl -c /tmp/wepost-cookies.txt \
  http://localhost:3333/api/v1/auth/csrf
```

Le navigateur et le client Nuxt gèrent automatiquement la lecture du cookie
CSRF. Pour les outils comme Postman, Bruno ou Insomnia, importer
`apps/api/resources/openapi.json`, activer le cookie jar puis transmettre
`X-XSRF-TOKEN`.

## Mise à jour de la documentation

Après toute modification de `apps/api/start/routes.ts` ou d’un contrat public :

1. mettre à jour les schémas publics du générateur si nécessaire ;
2. exécuter `pnpm api:docs:generate` ;
3. examiner le diff de `openapi.json` et `endpoints.md` ;
4. exécuter `pnpm api:docs:check` ;
5. lancer les tests API.

La CI exécute `pnpm api:docs:check`. Une route ajoutée, supprimée ou renommée
sans régénération bloque donc la fusion.
