# Accessibilité — Tâche 15

Les filtres utilisent des champs natifs avec libellés visibles. Le calcul, l’actualisation, l’export et les erreurs sont annoncés par des zones de statut ou d’alerte. Les six indicateurs possèdent un intitulé et une valeur textuels ; `N/A` est écrit explicitement.

Chaque graphique en barres est décoratif pour les technologies d’assistance et possède juste après lui un tableau complet avec légende, en-têtes de colonnes et en-têtes de lignes. La couleur n’est donc jamais le seul vecteur d’information. Les graphiques ne comportent aucune animation obligatoire et le CSS se replie sur une colonne à faible largeur.

Vitest vérifie l’alternative tabulaire. Playwright/axe couvre les filtres et le dashboard. Restent à vérifier manuellement en préproduction : parcours clavier complet, VoiceOver, zoom 200 %, reflow à 320 px, contraste dans les navigateurs cibles et ouverture du CSV avec un lecteur de tableur.
