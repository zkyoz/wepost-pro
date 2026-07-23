# Sécurité — Tâche 04

## Autorisation et isolation

- lecture protégée par `projects.read`, puis portée serveur du projet ;
- mutations protégées par `projects.manage` ;
- admin global, agence limitée à son `agency_id`, client limité à ses affectations ;
- ressource absente et ressource hors périmètre répondent toutes deux 404 ;
- un projet archivé refuse toute nouvelle publication.

## Intégrité des données

L’API dérive `agency_id`, `project_id`, le statut initial, les versions et les auteurs. VineJS ne retient aucun champ de mass assignment supplémentaire. PostgreSQL impose les statuts autorisés, une version positive, une approbation cohérente et l’unicité `(publication_id, version)`.

Le client envoie `contentVersion` lors d’une modification ou transition. Une version périmée produit un 409 et empêche l’écrasement. Une modification après approbation incrémente la version, annule `approved_version` et replace la publication en `in_progress`.

## Rendu et validation

- titre limité à 120 caractères et texte à 10 000 ;
- réseaux limités à la liste officielle du projet et sans doublon ;
- date ISO et fuseau IANA validés puis stockés en UTC ;
- aucun HTML riche n’est interprété : Nuxt utilise l’interpolation textuelle, sans `v-html` ;
- CSRF, session, CORS et contrôles de rôle des tâches précédentes restent actifs.

## Audit et logs

Les audits sont écrits dans la même transaction que la mutation. Les logs structurés exposent les identifiants techniques, ancien/nouveau statut et durée de liste, jamais le texte de publication. Les tests couvrent IDOR, écriture client, mass assignment, transition illégale, projet archivé et conflit optimiste.
