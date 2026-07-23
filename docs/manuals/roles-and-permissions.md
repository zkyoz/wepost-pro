# Manuel des rôles et permissions

## Rôles

- Administrateur : gère les comptes, les rôles et les désactivations.
- Agence : travaille dans le périmètre de son agence et, à partir de la tâche 03, de ses projets.
- Client : consulte et révise uniquement les projets auxquels il est affecté.

## Administration des comptes

Un administrateur connecté ouvre « Administration » puis « Utilisateurs ». Il peut choisir un rôle puis l’enregistrer, ou désactiver/réactiver un compte après confirmation. Il ne peut modifier ni son propre rôle ni son propre statut, et le dernier administrateur actif est protégé.

Une désactivation prend effet dès la requête privée suivante : même si le navigateur possède encore un cookie, l’API ferme la session et renvoie `401`.

## Routes

| Méthode | Route                            | Accès                        |
| ------- | -------------------------------- | ---------------------------- |
| GET     | `/api/v1/users/:id`              | session et portée ressource  |
| GET     | `/api/v1/admin/users`            | administrateur               |
| GET     | `/api/v1/admin/users/:id`        | administrateur               |
| PATCH   | `/api/v1/admin/users/:id/role`   | administrateur, autre compte |
| PATCH   | `/api/v1/admin/users/:id/status` | administrateur, autre compte |

Les mutations exigent le token CSRF de Shield. Chaque changement effectif ajoute une entrée à `audit_logs` avec l’acteur, la cible, l’ancienne valeur, la nouvelle valeur et la date UTC.

## Erreurs

- `401` : session absente, expirée ou compte désactivé ;
- `403` : action connue mais rôle insuffisant ;
- `404` : ressource absente ou hors périmètre ;
- `422` : identifiant, rôle ou état invalide.
