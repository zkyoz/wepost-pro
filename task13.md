# Tâche 13 — CRUD administrateur global

> Ordre : 13/23 — dépendances : tâches 01 à 12 validées.

## Objectif

Créer un espace d’administration global sécurisé pour consulter utilisateurs, projets, publications, comptes sociaux, incidents et audit ; gérer les rôles/statuts et l’archivage logique avec recherche, filtres et pagination.

## Exigences

- routes `/admin/*` accessibles uniquement aux administrateurs ;
- actions dédiées, CSRF, rate limiting, validation et protection contre le mass assignment ;
- aucun token, secret ou mot de passe sérialisé ;
- garde-fou du dernier administrateur actif ;
- audit durable, expurgé et non modifiable par les utilisateurs ;
- confirmations accessibles, tableaux avec légendes/en-têtes et pagination clavier ;
- tests unitaires, HTTP négatifs pour agence/client, E2E désactivation/réactivation et contrôles axe ;
- recette, sécurité, accessibilité, preuve, manuel et changelog mis à jour.

La suppression physique reste hors parcours normal. Toute valeur non vérifiée demeure documentée comme action manuelle ou `TODO`.
