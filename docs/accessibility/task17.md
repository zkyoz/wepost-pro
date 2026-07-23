# Accessibilité — Tâche 17

Les réseaux sont présentés dans un `tablist` avec `tab`, `aria-selected`, `aria-controls` et un `tabpanel`. Les flèches gauche/droite changent d’onglet et déplacent le focus ; un seul onglet reste dans l’ordre de tabulation.

L’état « brouillon », « approuvée » ou « obsolète » est écrit en toutes lettres. Le diff expose deux articles intitulés « Texte source » et « Variante réseau » : aucune information ne dépend du surlignage ou de la couleur. Le compteur est relié à la zone de texte et précise lorsque la limite officielle n’est pas configurée.

Les annonces utilisent `role="status"` et les erreurs `role="alert"`. Les actions nomment le réseau. La grille de comparaison passe de deux à une colonne à 48 rem et conserve un texte refluable. Le parcours Playwright Chromium incluant axe ne relève aucune violation sérieuse ou critique sur le parcours global.

Restent à exécuter en préproduction : parcours complet Tab/Shift+Tab et flèches, zoom 200 %, reflow 320 px, contrastes sur les navigateurs cibles et lecture VoiceOver des changements d’état.
