# Sécurité — Tâche 06

## Isolation et autorisation

La liste part de `scopedProjectQuery` : admin global, agence limitée à son `agency_id`, client limité à ses affectations. Les filtres ne peuvent élargir cette portée. Le déplacement exige `projects.manage`, puis vérifie à nouveau l’accès à la publication. Les ressources étrangères répondent 404 et les mutations client 403.

## Validation et concurrence

- plage strictement positive et limitée à 366 jours ;
- fuseau IANA vérifié côté serveur ;
- dates locales converties en UTC avec rejet des heures inexistantes au changement d’heure ;
- enums réseau/statut et UUID validés par VineJS ;
- pagination limitée à 100 éléments ;
- `content_version` attendue obligatoire, conflit renvoyé en 409 ;
- statuts terminaux non déplaçables ;
- statut et `approved_version` jamais fournis par le frontend.

## Sorties et journaux

Vue utilise l’interpolation textuelle et aucun `v-html`. Les logs structurés ne contiennent ni texte éditorial ni secret. Le déplacement produit un audit transactionnel avec instants, versions et statuts avant/après.
