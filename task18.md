# Tâche 18 — Annotations client

> Ordre : 18/23  
> Dépendances : Tâches 05 et 07 validées  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.3, C2.3.1

## Instruction à Codex

Lire d’abord `context.md`. Examiner l’existant et adapter l’implémentation au monorepo réel. Ne pas casser les tâches validées précédemment. Implémenter uniquement le périmètre de cette tâche et les refactorings strictement nécessaires. Toute valeur non vérifiable doit être laissée en `TODO` plutôt qu’inventée.

## Objectif

Permettre au client d’annoter un média d’une publication tout en fournissant une alternative accessible complète.

## Périmètre à implémenter

- Annotations point ou rectangle.
- Coordonnées normalisées.
- Texte obligatoire.
- Liste chronologique.
- Modification et suppression limitée.
- Lien depuis commentaire ou publication.
- Version du média annoté.

## Règles métier

- Une annotation est attachée à une version précise du média/publication.
- Une nouvelle version affiche l’annotation comme historique, pas comme annotation active.
- Le commentaire textuel est la source de vérité accessible.
- Le client ne peut annoter que ses projets.
- Pas d’annotation sans texte.

## Données et migrations

- `annotations`: id, publication_id, media_id, publication_version, author_id, shape, x, y, width, height, body, created_at, updated_at, deleted_at.
- Contraintes 0..1 sur coordonnées.

## API, interface et autorisations

- CRUD annotations et liste par média/version avec accès protégé.
- Visionneuse média, overlay, formulaire et liste textuelle synchronisée.
- Client/agence/admin sur projet autorisé.
- Modification par auteur, modération admin tracée.

## RGAA et sécurité

- Alternative complète sans canvas, annotations numérotées et création clavier.
- Focus géré, contraste de l’overlay, liste utilisable au zoom.
- Validation des coordonnées, texte rendu en texte brut et protection IDOR.
- Ne pas exposer une URL R2 permanente.

## Tests et livrables

- Tests unitaires coordonnées/version, intégration CRUD/permissions et E2E souris/clavier/historique.
- Mettre à jour `docs/recette/task18.md`, `docs/evidence/task18.md`,
  `docs/security/task18.md`, `docs/accessibility/task18.md`, les manuels et `CHANGELOG.md`.
