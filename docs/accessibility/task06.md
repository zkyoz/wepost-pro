# Accessibilité — Tâche 06

## Mesures intégrées

- vue liste complète indépendante de la grille visuelle ;
- sélecteurs Mois/Semaine/Liste avec `aria-pressed` ;
- événements structurés en articles et nom accessible comprenant titre, projet, statut et date ;
- statuts toujours écrits en toutes lettres ;
- déplacement par `<details>` et formulaire natif, sans dépendre du glisser-déposer ;
- filtres explicitement étiquetés ;
- changements et conflits annoncés avec `aria-live`/`role="alert"` ;
- reflow en liste sous 768 px ;
- focus replacé sur le titre après changement de période.

## Contrôles automatisés

Playwright parcourt les filtres et le formulaire de déplacement sur desktop/mobile. Le scan axe de fin de parcours couvre la vue liste client et refuse toute violation sérieuse ou critique.

## Contrôles manuels restant en préproduction

- parcours complet Tab/Maj+Tab/Entrée/Espace ;
- annonce des changements de vue, période, filtres et conflits avec VoiceOver ;
- zoom 200 % et reflow réel à 320 px ;
- cohérence de lecture des jours et événements ;
- contrôle visuel des contrastes et du focus.

Aucune conformité RGAA complète n’est déclarée avant ces vérifications.
