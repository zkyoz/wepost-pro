# Tâche 02 — Gestion des rôles et permissions

> Ordre : 2/23  
> Dépendances : Tâche 01 validée  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.2, C2.2.3

## Instruction à Codex

Lire d’abord `context.md`. Examiner l’existant et adapter l’implémentation au monorepo réel. Ne pas casser les tâches validées précédemment. Implémenter uniquement le périmètre de cette tâche et les refactorings strictement nécessaires. Toute valeur non vérifiable doit être laissée en `TODO` plutôt qu’inventée.

## Objectif

Mettre en place une autorisation centralisée et testable pour les rôles administrateur, agence et client.

## Périmètre à implémenter

- Créer l’énumération des rôles.
- Créer des policies ou guards centralisés.
- Ajouter une matrice d’autorisation documentée.
- Créer des composants de navigation adaptés sans considérer le masquage UI comme une sécurité.
- Préparer l’affectation d’un client à un projet.

## Règles métier

- Politique deny-by-default.
- Un compte désactivé ne peut plus utiliser un token encore valide.
- Un client ne voit jamais les données d’un autre client.
- Le rôle ne peut pas être modifié par son propre titulaire.
- Les réponses 403 et 404 sont choisies pour limiter les fuites d’information.

## Données et migrations

- Ajouter ou normaliser `users.role` avec `admin | agency | client`.
- Préparer `agency_id`.
- Créer `audit_logs` si nécessaire pour les changements de rôle et désactivations.

## API et services

- Routes d’administration minimales pour attribuer un rôle uniquement à un admin.
- Middleware `auth` puis policy métier.
- Helpers partagés pour les règles d’accès.

## Interface

- Navigation adaptée au rôle.
- Page d’accès refusé compréhensible.
- Ne pas rendre un contrôle interactif inaccessible uniquement en le cachant visuellement.

## Autorisations

- Admin : tous les périmètres.
- Agence : périmètre agence et projets autorisés.
- Client : uniquement les projets assignés et actions client.
- Tests négatifs obligatoires pour chaque règle.

## RGAA 4.1.2

- Le changement de contenu selon le rôle doit être annoncé après navigation.
- Les contrôles masqués ne doivent pas laisser de focus fantôme.
- Les messages 403 doivent être compréhensibles.

## Sécurité

- Tests IDOR.
- Tests de modification de rôle.
- Validation enum.
- Audit log non modifiable par les utilisateurs.
- Centraliser les permissions pour éviter les vérifications dispersées.

## Tests obligatoires

- Table-driven tests de la matrice des permissions.
- Tests unitaires des policies.
- Tests HTTP pour chaque rôle.
- Test d’un client tentant d’accéder à une ressource d’un autre client.
- E2E avec trois comptes de test.

## Observabilité

- Journaliser les refus sensibles avec identifiant utilisateur et route, sans données privées.
- Créer une métrique de refus d’autorisation.

## Livrables documentaires et preuves

Mettre à jour ou créer :

- `docs/recette/task02.md` avec les scénarios, préconditions, étapes, résultats attendus et résultats observés ;
- `docs/evidence/task02.md` avec les fichiers modifiés, migrations, routes, composants, tests, couverture, SHA et captures à fournir ;
- `docs/security/task02.md` ;
- `docs/accessibility/task02.md` ;
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
