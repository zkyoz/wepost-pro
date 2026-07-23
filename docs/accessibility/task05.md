# Accessibilité — Tâche 05

## Mesures intégrées

- sélection native `<input type="file">`, sans drag-and-drop obligatoire ;
- alternative obligatoire pour une image informative ou choix décoratif explicite ;
- prévisualisation avec `alt=""` lorsque décorative ;
- vidéo sans lecture automatique, avec contrôles natifs ;
- progression native `<progress>` nommée et annoncée avec `aria-live` ;
- erreurs par fichier exposées par `role="alert"` ;
- réordonnancement par boutons Monter/Descendre accessibles au clavier ;
- statut d’ajout, d’ordre, de modification et de suppression annoncé ;
- mise en page reflow sur une colonne sous 640 px, sans contenu clignotant.

## Contrôles automatisés

Le parcours Playwright de la fiche publication vérifie l’upload, l’alternative visible pour l’agence puis le client et l’absence de commande de suppression côté client. Le scan axe existant couvre la fiche complète après ajout du média.

## Contrôles manuels à consigner en préproduction

- upload et réordonnancement uniquement avec Tab, Maj+Tab, Entrée et Espace ;
- restitution de la progression, des erreurs et des changements d’ordre avec VoiceOver ;
- pertinence éditoriale des alternatives ;
- zoom 200 % et reflow 320 px ;
- focus après confirmation de suppression.

Ces contrôles n’ayant pas encore été exécutés sur la préproduction, aucune conformité RGAA complète n’est déclarée.
