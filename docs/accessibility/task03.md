# Accessibilité — Tâche 03

## Contrôles intégrés

- liste de projets structurée avec `<ul>` et titres de cartes ;
- recherche dans une région `role="search"` avec labels explicites ;
- compteurs en liste de définitions ;
- formulaires natifs, champs requis et résumé d’erreurs focalisé ;
- état vide et résultats annoncés aux technologies d’assistance ;
- fil d’Ariane nommé sur les quatre écrans ;
- confirmation d’archivage avec `<dialog>`, focus initial sur Annuler et retour au déclencheur à la fermeture ;
- pagination nommée et focus replacé sur le titre après changement de page ;
- reflow responsive de la liste, des filtres et de la fiche.

## Résultats automatisés du 22/07/2026

Les 10 scénarios Playwright passent sur Chromium desktop et mobile. Le scénario tâche 03 réalise création par l’agence, consultation par le client et vérification de l’absence de contrôles de mutation. Axe ne relève aucune violation sérieuse ou critique sur la fiche projet testée.

## Vérifications manuelles restantes

- fermeture de la confirmation avec Échap et restitution du focus avec VoiceOver ;
- zoom à 200 % et reflow à 320 px en recette ;
- annonce du résumé d’erreurs sur lecteur d’écran ;
- contraste avec les styles réellement déployés.

Ces résultats ne constituent pas une déclaration de conformité RGAA complète.
