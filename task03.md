# Tâche 03 — CRUD Projet pour les trois rôles

> Ordre : 3/23  
> Dépendances : Tâches 01 et 02 validées  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.2, C2.2.3, C2.3.1

## Instruction à Codex

Lire d’abord `context.md`. Examiner l’existant et adapter l’implémentation au monorepo réel. Ne pas casser les tâches validées précédemment. Implémenter uniquement le périmètre de cette tâche et les refactorings strictement nécessaires. Toute valeur non vérifiable doit être laissée en `TODO` plutôt qu’inventée.

## Objectif

Créer la gestion des projets clients avec des vues et droits adaptés aux trois rôles.

## Périmètre à implémenter

- Créer, lire, modifier, archiver et lister les projets.
- Affecter un client principal et, si utile, plusieurs membres.
- Ajouter recherche, filtres et pagination.
- Créer les écrans liste, création, édition et détail.
- Créer un historique minimal des changements sensibles.

## Règles métier

- Admin : CRUD complet.
- Agence : CRUD des projets de l’agence.
- Client : lecture des projets auxquels il est affecté.
- Le client ne peut pas modifier les champs du projet.
- Un projet archivé reste consultable mais n’accepte plus de nouvelles publications sans réactivation.
- Les dates sont stockées en UTC.

## Données et migrations

- `projects`: id, agency_id, name, description, status, client_user_id, timezone, created_by, created_at, updated_at, archived_at.
- `project_members`: project_id, user_id, membership_role, created_at.
- Contraintes et index sur agency_id, client_user_id et status.

## API et services

- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `DELETE /projects/:id` ou action d’archivage.
- Routes d’affectation des membres si nécessaires.

## Interface

- Liste responsive avec recherche et filtres.
- Formulaire accessible.
- Fiche projet.
- État vide.
- Confirmation d’archivage.
- Fil d’Ariane.

## Autorisations

- Appliquer la matrice décrite dans les règles.
- Vérifier l’affectation côté serveur sur toutes les routes.
- Ne jamais faire confiance à un `agency_id` envoyé par le client.

## RGAA 4.1.2

- Tableaux ou listes avec structure sémantique.
- Libellés explicites.
- Confirmation accessible.
- Focus rendu après fermeture de modale.
- État vide et erreurs annoncés.

## Sécurité

- Protection IDOR.
- Validation longueur et formats.
- Journalisation création, modification, archivage et changement de client.
- Pas de suppression physique par défaut.

## Tests obligatoires

- Unitaires : règles de projet et archivage.
- Intégration : CRUD pour admin/agence/client.
- Sécurité : accès inter-client et falsification agency_id.
- E2E : agence crée un projet, client le consulte, client ne peut pas l’éditer.

## Observabilité

- Compteurs de projets actifs/archivés.
- Logs d’audit consultables ultérieurement par l’admin.

## Livrables documentaires et preuves

Mettre à jour ou créer :

- `docs/recette/task03.md` avec les scénarios, préconditions, étapes, résultats attendus et résultats observés ;
- `docs/evidence/task03.md` avec les fichiers modifiés, migrations, routes, composants, tests, couverture, SHA et captures à fournir ;
- `docs/security/task03.md` ;
- `docs/accessibility/task03.md` ;
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
