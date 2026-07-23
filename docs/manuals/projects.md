# Manuel des projets

## Accès par rôle

- Administrateur : consulte et gère tous les projets.
- Agence : consulte et gère uniquement les projets de son `agency_id`.
- Client : consulte uniquement les projets dont il est membre.

## Créer et modifier

Depuis « Projets », un administrateur ou un membre agence choisit « Créer un projet ». Le formulaire demande le nom, la description, le client principal, les membres supplémentaires et le fuseau horaire IANA.

L’agence du projet est toujours dérivée du client principal par l’API. Elle n’est jamais fournie par le formulaire. Tous les membres doivent être des clients actifs de cette même agence.

## Archiver et réactiver

« Archiver » ouvre une confirmation. Après validation, le projet reste consultable et son statut devient `archived`. Il ne peut plus être modifié et le contrat métier interdit les nouvelles publications. « Réactiver » remet le projet à l’état `active`.

## Recherche et pagination

La liste accepte une recherche par nom, un filtre actif/archivé et une pagination de 12 éléments par défaut, 50 maximum. Les compteurs actifs et archivés respectent le périmètre de l’utilisateur connecté.

## Routes API

| Méthode | Route                          | Usage                             |
| ------- | ------------------------------ | --------------------------------- |
| GET     | `/api/v1/projects`             | liste filtrée et paginée          |
| GET     | `/api/v1/projects/clients`     | clients affectables, admin/agence |
| POST    | `/api/v1/projects`             | création, admin/agence            |
| GET     | `/api/v1/projects/:id`         | détail selon affectation          |
| PATCH   | `/api/v1/projects/:id`         | modification, admin/agence        |
| DELETE  | `/api/v1/projects/:id`         | archivage logique                 |
| POST    | `/api/v1/projects/:id/restore` | réactivation                      |
