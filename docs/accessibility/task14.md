# Accessibilité — Tâche 14

Les indicateurs sont fournis sous forme de boutons avec libellé et valeur textuels : aucune information ne dépend uniquement de la couleur. Les listes utilisent un tableau avec légende, en-têtes de colonnes et liens explicites vers les publications.

Tous les filtres possèdent un libellé, l’actualisation et le marquage lu sont annoncés par une zone `aria-live`, et le focus revient au titre de la liste après un changement de catégorie ou de page. Le tableau possède un défilement horizontal à faible largeur sans bloquer le reflow global.

Vitest vérifie les noms et valeurs des compteurs. Playwright/axe couvre le commentaire client puis son apparition et son marquage lu. Restent manuels en préproduction : clavier complet, VoiceOver, zoom 200 %, reflow 320 px et lecture du tableau.
