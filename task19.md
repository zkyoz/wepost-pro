# Tâche 19 — Export ICS

> Ordre : 19/23  
> Dépendances : Tâches 06 et 07 validées

## Objectif

Permettre à l’agence et à l’administrateur de télécharger un calendrier éditorial ICS ou de créer un flux d’abonnement signé, hashé et révocable.

## Périmètre

- export par projet et plage de dates ;
- flux privé à token aléatoire long, stocké uniquement sous forme de hash ;
- UID stable par publication, version, mise à jour et annulation ;
- dates UTC compatibles avec les fuseaux des calendriers clients ;
- interface de téléchargement, création, copie et révocation ;
- tests de sérialisation, injection, permissions, token et parcours E2E ;
- documentation de recette, sécurité, accessibilité et import.

Les clients restent exclus tant qu’aucun paramètre métier n’active explicitement leur export. Aucun commentaire, texte de publication, secret ou donnée client privée n’est inclus dans l’ICS.
