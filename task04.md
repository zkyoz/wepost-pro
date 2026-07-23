# Tâche 04 — CRUD Publications sans images

> Ordre : 4/23  
> Dépendances : Tâches 01 à 03 validées  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.2, C2.2.3, C2.3.1

## Instruction à Codex

Lire d’abord `context.md`. Examiner l’existant et adapter l’implémentation au monorepo réel. Ne pas casser les tâches validées précédemment. Implémenter uniquement le périmètre de cette tâche et les refactorings strictement nécessaires. Toute valeur non vérifiable doit être laissée en `TODO` plutôt qu’inventée.

## Objectif

Créer le cœur métier des publications textuelles et leur machine à états, sans gestion de média.

## Périmètre

- créer, lire, modifier, dupliquer, archiver et lister une publication ;
- associer une publication à un projet ;
- gérer titre interne, texte, réseaux ciblés, date souhaitée, fuseau et statut ;
- créer un numéro de version optimiste ;
- créer les écrans liste et édition.

## Règles métier

- seule l’agence ou l’admin crée et modifie ;
- le client consulte les publications de ses projets ;
- une modification incrémente `content_version` ;
- une modification après approbation remet le statut en `in_progress` et invalide l’approbation ;
- les transitions suivent la machine définie dans `context.md` et les transitions illégales sont interdites.

## Données

- `publications` : id, agency_id, project_id, title, base_text, status, target_networks, scheduled_at, timezone, content_version, approved_version, created_by, updated_by, timestamps, archived_at ;
- `publication_versions` : publication_id, version, snapshot_json, author_id, created_at ;
- contraintes sur statut et version.

## API

```text
GET  /projects/:projectId/publications
POST /projects/:projectId/publications
GET  /publications/:id
PATCH /publications/:id
POST /publications/:id/duplicate
POST /publications/:id/archive
POST /publications/:id/transition
```

## Interface

- Liste filtrable par statut, projet et réseau.
- Éditeur de texte.
- Sélecteur de réseaux.
- Date, heure et fuseau.
- Historique des versions en lecture.
- Indicateur de modifications non enregistrées.

## Autorisations

- Admin et agence : CRUD.
- Client : lecture uniquement à cette étape.
- Les actions interdites sont rejetées côté API.

## RGAA 4.1.2

- Statuts non identifiés uniquement par la couleur.
- Champs date et fuseau correctement étiquetés.
- Messages de conflit de version explicites.
- Historique navigable au clavier.
- Compteur de caractères accessible.

## Sécurité

- Contrôle de concurrence optimiste.
- Sanitisation lors de tout rendu riche.
- Validation des réseaux autorisés.
- Audit des changements de statut.
- Tests mass assignment.

## Tests obligatoires

- Unitaires : machine à états et invalidation d’approbation.
- Unitaires : contrôle de version.
- Intégration : CRUD et transitions.
- Sécurité : client en écriture, projet non autorisé.
- E2E : agence crée, édite et archive une publication.
- Cette tâche doit fournir l’exemple principal de harnais de tests du dossier.

## Observabilité

- Mesurer le temps de réponse des listes.
- Journaliser les transitions avec ancien et nouveau statut.

## Livrables documentaires et preuves

Mettre à jour ou créer :

- `docs/recette/task04.md` avec les scénarios, préconditions, étapes, résultats attendus et résultats observés ;
- `docs/evidence/task04.md` avec les fichiers modifiés, migrations, routes, composants, tests, couverture, SHA et captures à fournir ;
- `docs/security/task04.md` ;
- `docs/accessibility/task04.md` ;
- `CHANGELOG.md` avec une entrée Conventional Commits ;
- les manuels concernés dans `docs/manuals/`.

## Définition de terminé

- [ ] Fonctionnalité utilisable sur le parcours nominal.
- [ ] Autorisations testées côté serveur.
- [ ] Migrations appliquées et documentées.
- [ ] Tests unitaires écrits.
- [ ] Tests d’intégration écrits.
- [ ] Test E2E critique écrit ou justification documentée.
- [ ] Cas d’erreur et de sécurité couverts.
- [ ] Exigences RGAA vérifiées.
- [ ] Build, lint et typecheck verts.
- [ ] Recette exécutée en préproduction.
- [ ] Documentation et preuves mises à jour.
- [ ] Aucun secret ou token dans le dépôt et les logs.

## Compte rendu attendu de Codex

Terminer la réponse par :

1. résumé de l’implémentation ;
2. fichiers créés ou modifiés ;
3. migrations ;
4. commandes exécutées ;
5. résultats des tests et couverture ;
6. résultats RGAA ;
7. risques ou limites ;
8. actions manuelles restantes.
