# Matrice d’autorisation

## Principe

Le serveur applique une politique deny-by-default. Une route privée exécute d’abord le session guard `web`, puis le middleware de permission et enfin la règle de portée de la ressource. Le filtrage de la navigation Nuxt améliore l’expérience, mais ne participe jamais à la sécurité.

## Permissions globales

| Permission        | Administrateur |   Agence    |    Client    |
| ----------------- | :------------: | :---------: | :----------: |
| `users.read`      |      oui       |     non     |     non      |
| `users.manage`    |      oui       |     non     |     non      |
| `projects.read`   |      oui       | oui, agence | oui, affecté |
| `projects.manage` |      oui       | oui, agence |     non      |
| `projects.review` |      oui       | oui, agence | oui, affecté |

La matrice exécutable se trouve dans `apps/api/app/domain/auth/permissions.ts`. Un rôle ou une permission inconnus sont refusés.

## Portées de ressources

| Ressource                    | Administrateur    | Agence           | Client                               |
| ---------------------------- | ----------------- | ---------------- | ------------------------------------ |
| utilisateur                  | tous              | même `agency_id` | lui-même uniquement                  |
| projet                       | tous              | même `agency_id` | même `agency_id` et membre du projet |
| changement de rôle ou d’état | autre utilisateur | interdit         | interdit                             |

Une ressource existante mais hors périmètre renvoie `404` lorsque révéler son existence faciliterait une attaque IDOR. Une action connue mais interdite, comme l’accès à `/admin`, renvoie `403`.

## Affectation projet préparée

`ProjectAccessContext` exige un `agencyId` et la liste des identifiants membres. La tâche 03 devra brancher cette règle sur les tables `projects` et `project_members`, puis filtrer les requêtes SQL avant sérialisation.
