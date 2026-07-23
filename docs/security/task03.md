# Sécurité — Tâche 03

## Autorisation et isolation

- `projects.read` protège la liste et le détail ;
- `projects.manage` protège création, modification, archivage et réactivation ;
- l’admin accède à tous les projets ;
- l’agence est filtrée par son `agency_id` serveur ;
- le client exige simultanément le même `agency_id` et une ligne `project_members` ;
- les projets hors périmètre renvoient le même `404` que les projets inexistants.

## Affectations

L’API n’accepte aucun champ `agency_id`. Elle dérive l’agence du client principal, vérifie que celui-ci est un client actif puis vérifie tous les membres. Une agence ne peut sélectionner un client d’une autre agence. La falsification d’un `agency_id` supplémentaire n’a aucun effet.

## Validation et intégrité

- UUID, longueurs, enum de statut et fuseau IANA validés ;
- contraintes PostgreSQL sur statuts et rôles de membre ;
- unicité de l’affectation par clé primaire composée ;
- aucune suppression physique via `DELETE` ;
- un projet archivé ne peut pas être modifié avant réactivation ;
- toutes les mutations utilisent CSRF et le session guard existants.

## Audit

Création, modification, changement de client, archivage et réactivation sont enregistrés avec l’acteur et le projet dans la même transaction que la mutation. Le détail public ne restitue que l’action et la date ; les anciennes/nouvelles valeurs restent dans `audit_logs` pour une future interface administrateur.

## Tests

Les tests couvrent IDOR inter-client, isolation inter-agence, falsification d’agence, lecture client, refus des mutations client, projet archivé et absence de suppression physique.
