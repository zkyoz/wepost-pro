# Accessibilité — Tâche 04

## Contrôles intégrés

- statuts toujours accompagnés d’un libellé textuel, jamais transmis par la couleur seule ;
- labels explicites pour titre, texte, date, fuseau et réseaux ;
- compteur de caractères et indicateur de modifications annoncés avec `role="status"` ;
- erreurs regroupées dans une zone focalisable `role="alert"` ;
- filtres et pagination utilisables au clavier ;
- historique en éléments natifs `<details>/<summary>` ;
- contenu affiché comme texte avec conservation des retours à la ligne ;
- mise en page responsive jusqu’à 320 px ;
- confirmation d’archivage native, avec retour automatique au contexte du navigateur.

## Résultats automatisés du 22/07/2026

Les 10 scénarios Playwright passent sur Chromium desktop et mobile. Le parcours tâche 04 crée, modifie et archive côté agence, puis ouvre la publication côté client sans contrôle d’écriture. Axe ne relève aucune violation sérieuse ou critique sur cette fiche finale.

## Vérifications manuelles restantes

- parcours complet Tab et Shift+Tab, notamment l’historique ;
- annonce du conflit de version et du résumé d’erreurs avec VoiceOver ;
- confirmation native d’archivage sur les navigateurs cibles ;
- zoom 200 %, reflow exact 320 px et contrastes en préproduction.

Ces résultats ne constituent pas une déclaration de conformité RGAA complète.
