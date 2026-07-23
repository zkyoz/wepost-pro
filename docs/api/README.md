# Documentation de l’API

La spécification de référence est générée au format OpenAPI 3.1 dans
[`apps/api/resources/openapi.json`](../../apps/api/resources/openapi.json).

Les deux commandes à utiliser sont :

```bash
pnpm api:docs:generate
pnpm api:docs:check
```

La première régénère la spécification et le catalogue Markdown. La seconde ne
modifie aucun fichier et échoue lorsqu’une route Adonis ne correspond plus à la
documentation enregistrée.

Lorsque l’API fonctionne localement :

- interface consultable : <http://localhost:3333/api/docs> ;
- contrat OpenAPI : <http://localhost:3333/api/openapi.json>.

Le fonctionnement de l’authentification, de CSRF, des permissions et des
réponses est détaillé dans le
[manuel de l’API](../manuals/api.md).
