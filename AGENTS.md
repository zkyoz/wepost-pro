# AGENTS.md — Livraison Wepost.pro

Wepost.pro est un projet de fin d’études associé au titre Expert en
Développement Logiciel — RNCP 39583. Toute intervention doit produire une
livraison fonctionnelle, testée, sécurisée, accessible, documentée, versionnée
et traçable.

Les instructions explicites les plus récentes de l’utilisateur restent
prioritaires.

## Lecture obligatoire

Avant toute intervention :

1. lire intégralement `context.md` ;
2. lire le fichier `taskXX.md` concerné lorsqu’il existe ;
3. examiner le code, les tests, les migrations et la documentation existants ;
4. examiner `.github/workflows/` et l’état Git ;
5. vérifier les contrôles bloquants des tâches précédentes.

Ne pas créer d’architecture parallèle lorsqu’une structure fonctionnelle
existe.

## Analyse préalable

Avant une modification, identifier :

1. la tâche et les fonctionnalités concernées ;
2. les composants impactés : Nuxt, AdonisJS, worker, PostgreSQL, Redis, R2 et
   infrastructure ;
3. les risques de régression et de sécurité ;
4. les critères RGAA concernés ;
5. les migrations et contraintes nécessaires ;
6. les tests à créer ou modifier ;
7. les documents et preuves à mettre à jour ;
8. les compétences RNCP couvertes.

Ne pas commencer une nouvelle fonctionnalité si un contrôle bloquant antérieur
échoue.

## Branches

`develop` et `main` sont protégées. Aucun développement, push direct,
force-push ou contournement de CI n’y est autorisé après le bootstrap initial.

Une branche part de la dernière version valide de `develop` :

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

Toute intégration passe par une Pull Request :

```text
branche dédiée → develop → recette → main → production
```

## Commits

Utiliser Conventional Commits :

```text
type(scope): description courte à l’impératif
```

Types autorisés :

```text
feat fix test docs refactor perf security a11y ci build chore revert
```

Chaque commit doit être atomique, compréhensible, limité à une intention,
cohérent, accompagné des tests pertinents et exempt de secret. Ne pas mélanger
fonctionnalité, refactoring et corrections indépendantes.

Ne jamais utiliser `git add .` sans avoir vérifié précisément le périmètre. Ne
jamais utiliser `git push --force` sur une branche partagée ou protégée.

## Contrôles avant commit et Pull Request

Adapter les commandes au périmètre, puis exécuter avant fusion :

```bash
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

Ajouter selon le changement :

- tests unitaires Vitest ou Japa ;
- tests HTTP, PostgreSQL et Redis ;
- tests worker BullMQ ;
- tests Playwright et axe ;
- tests de migrations et rollback ;
- scan de secrets et analyse statique ;
- mesure de performance reproductible.

Ne jamais déclarer un test, une couverture, une performance ou une conformité
comme obtenus sans résultat vérifiable.

## Tests

Tester les règles métier, validations, transitions, autorisations, erreurs,
limites et cas nominaux.

Les tests d’intégration couvrent les routes, PostgreSQL, Redis, relations,
transactions et isolations par `agency_id`, projet et client.

Les E2E couvrent les parcours critiques concernés. Toute correction de bogue
ajoute un test qui reproduit le défaut et empêche sa réapparition.

Objectifs :

- lignes globales : au moins 80 % ;
- branches globales : au moins 70 % ;
- autorisations et publication : au moins 90 % ;
- 100 % des contrôles bloquants avant fusion.

Seules les valeurs mesurées peuvent être documentées.

## Sécurité

Analyser chaque changement au regard de l’OWASP Top 10 et vérifier :

- autorisations serveur et deny-by-default ;
- isolation agence, projet et client ;
- validation systématique des entrées ;
- requêtes paramétrées ou ORM ;
- protection IDOR, CSRF, CORS et rate limiting ;
- messages d’erreur sans fuite d’information ;
- cookies, tokens OAuth et secrets absents des logs ;
- chiffrement des tokens OAuth ;
- contrôle MIME réel, taille et quarantaine des médias ;
- journal d’audit des actions sensibles ;
- dépendances sans vulnérabilité critique non justifiée ;
- absence de secret commité.

Le masquage d’un bouton frontend n’est jamais une autorisation.

## Accessibilité

La cible est RGAA 4.1.2. Selon le périmètre, vérifier :

- structure sémantique et titres ;
- navigation clavier, focus visible et absence de piège ;
- noms accessibles et labels ;
- erreurs et messages `aria-live` ;
- contrastes et information non portée uniquement par la couleur ;
- alternatives textuelles ;
- zoom 200 % et reflow 320 px ;
- modales et tableaux accessibles ;
- alternatives au glisser-déposer ;
- langue de page et changements de langue.

Distinguer contrôles automatisés, contrôles manuels, conformités,
non-conformités et critères non applicables. Ne jamais déclarer une conformité
RGAA totale sans audit complet.

## Pull Requests

Le titre suit Conventional Commits. La description contient au minimum :

- objectif, tâche et compétences RNCP ;
- modifications frontend, API, worker, base, infrastructure et documentation ;
- migrations, réversibilité et données impactées ;
- autorisations, risques OWASP et secrets ;
- critères RGAA, tests automatisés et manuels ;
- tests unitaires, intégration, E2E, non-régression et couverture ;
- recette, déploiement, variables, health checks et rollback ;
- documentation, preuves, risques et limites.

Une PR reste en brouillon tant qu’un contrôle bloquant manque. Elle ne peut être
fusionnée que lorsque la CI, les tests, les builds, les migrations et les scans
sont acceptables et que les conversations sont résolues.

## CI

À chaque push sur `develop` ou `main` et à chaque Pull Request, GitHub Actions
doit exécuter :

1. checkout et installation reproductible avec Node cible ;
2. PostgreSQL et Redis de test ;
3. formatage, lint, TypeScript et i18n ;
4. synchronisation OpenAPI ;
5. tests unitaires et d’intégration avec couverture ;
6. E2E et axe ;
7. builds web, API et worker ;
8. audit des dépendances ;
9. Gitleaks et analyse statique ;
10. archivage des rapports.

Ne pas masquer un échec par `continue-on-error`, `|| true`, suppression d’un
test ou abaissement arbitraire d’un seuil.

## Déploiement

Après fusion dans `develop`, la recette utilise des bases, Redis, secrets et
préfixes R2 dédiés. Exécuter migrations, health checks, smoke tests et
enregistrer le SHA déployé.

La production vient exclusivement de `main`, après :

1. recette validée ;
2. PR `develop` vers `main` relue ;
3. CI verte ;
4. changelog finalisé ;
5. tag ou release ;
6. approbation manuelle de l’environnement ;
7. sauvegarde et migrations ;
8. déploiement Coolify ;
9. health checks, smoke tests et supervision ;
10. disponibilité d’un rollback.

## Versions et changelog

Utiliser Semantic Versioning :

```text
v0.1.0-rc.1
v0.1.0
v0.1.1
v1.0.0
```

Maintenir `CHANGELOG.md` avec une section `Unreleased` et des rubriques
factuelles : Added, Changed, Fixed, Security, Accessibility, Deprecated et
Removed.

Les versions doivent être traçables par commits, PR, tags, releases, SHA
déployé et preuves de recette.

## Bogues

Un bogue suit le cycle :

```text
détection
→ reproduction
→ qualification
→ cause racine
→ test en échec
→ correction
→ test de non-régression
→ revue
→ recette
→ livraison
→ documentation
```

Consigner date, environnement, version/SHA, gravité, fréquence, impact,
reproduction, cause, correctif, test, recette, branche, commit, PR et version
dans `docs/bugs/` lorsqu’une anomalie est confirmée.

## Migrations

Toute modification de schéma utilise une migration versionnée avec UUID,
`agency_id` lorsque nécessaire, clés étrangères, contraintes, index, valeurs
par défaut, timestamps UTC, stratégie de suppression et rollback raisonnable.

Tester la migration sur une base dédiée, documenter les risques et prévoir une
sauvegarde avant toute migration destructive.

## Documentation et preuves

Pour une tâche numérotée, créer ou mettre à jour :

```text
docs/recette/taskXX.md
docs/evidence/taskXX.md
docs/security/taskXX.md
docs/accessibility/taskXX.md
CHANGELOG.md
```

Mettre également à jour selon le périmètre : architecture, API, déploiement,
manuels, bugs, performance, ADR et README.

Une preuve contient uniquement des données obtenues : fichiers, migrations,
routes, tests, couverture, run CI, SHA, PR, tag, environnement, health checks,
smoke tests, captures expurgées, limites et anomalies.

## Définition de terminé

Une tâche est terminée seulement lorsque :

- le périmètre est fonctionnel et respecte l’architecture ;
- les autorisations serveur, migrations et contraintes sont présentes ;
- les tests pertinents et les non-régressions réussissent ;
- les contrôles de sécurité et RGAA sont documentés ;
- formatage, lint, TypeScript, tests, CI et builds sont verts ;
- la recette et les preuves sont à jour ;
- aucun secret n’est commité ;
- le SHA livré, les limites et les actions manuelles sont identifiables.

## Compte rendu final

Indiquer sans inventer :

- statut, tâche, branche et compétences RNCP ;
- fichiers et fonctionnalités modifiés ;
- commits, PR, tag et version ;
- migrations, contraintes et rollback ;
- commandes et résultats des tests ;
- couverture, lint, formatage, TypeScript, build, audit et scan ;
- environnement, SHA, health checks, smoke tests et rollback ;
- recette, preuves, sécurité, accessibilité, changelog, manuels et ADR ;
- limites, risques, actions manuelles et informations non vérifiées.

Le code seul n’est jamais considéré comme une livraison terminée.
