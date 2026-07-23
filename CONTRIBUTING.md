# Contribuer à Wepost.pro

## Avant de commencer

1. Lire `context.md`, `AGENTS.md` et la tâche concernée.
2. Vérifier les issues existantes et créer ou choisir une issue.
3. Partir de la dernière version valide de `develop`.
4. Ne jamais placer de secret dans Git, une issue, une Pull Request ou un log.

## Branches

```text
feature/taskXX-description
fix/taskXX-description
docs/description
test/description
ci/description
refactor/description
chore/description
security/description
```

`main` et `develop` sont réservées aux Pull Requests. Les force-push y sont
interdits.

## Commits

Utiliser Conventional Commits :

```text
type(scope): description courte à l’impératif
```

Types acceptés : `feat`, `fix`, `test`, `docs`, `refactor`, `perf`,
`security`, `a11y`, `ci`, `build`, `chore` et `revert`.

Un commit doit représenter une intention principale, conserver un dépôt
cohérent et inclure les tests directement liés à son changement.

## Contrôles locaux

Node.js 24 et pnpm 11.11.0 sont requis.

```bash
pnpm install --frozen-lockfile
pnpm infra:up
pnpm format:check
pnpm lint
pnpm typecheck
pnpm i18n:check
pnpm api:docs:check
pnpm test:coverage
pnpm test:e2e
pnpm build
pnpm audit --audit-level high
```

Adapter la campagne au périmètre pendant le développement, puis exécuter tous
les contrôles bloquants avant de demander la fusion.

## Pull Requests

- lier l’issue avec `Closes #…` uniquement si la PR satisfait réellement tous
  ses critères ;
- compléter le template sans inventer de test, métrique ou recette ;
- fournir les migrations et leur stratégie de rollback ;
- distinguer les tests automatisés des contrôles RGAA manuels ;
- conserver la PR en brouillon tant qu’un contrôle bloquant manque ;
- ne pas fusionner une CI rouge.

## Documentation et preuves

Une fonctionnalité numérotée met à jour, selon son périmètre :

```text
docs/recette/taskXX.md
docs/evidence/taskXX.md
docs/security/taskXX.md
docs/accessibility/taskXX.md
CHANGELOG.md
```

Les numéros de PR, SHA, runs CI, captures et résultats de recette ne sont
ajoutés qu’après obtention de la preuve correspondante.

## Versions

Le projet suit Semantic Versioning :

- `v0.x.y-rc.n` : candidat de recette ;
- `v0.x.y` : préversion validée selon son périmètre ;
- `v1.0.0` : première version de production déclarée stable.

Une release de production est créée depuis `main`, après validation de la
recette et approbation manuelle.
