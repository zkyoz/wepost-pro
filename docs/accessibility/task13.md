# Accessibilité — Tâche 13

Les listes utilisent des tableaux natifs avec `caption`, en-têtes de colonnes et en-têtes de lignes. Les filtres ont des libellés explicites, la pagination possède un nom accessible et rend le focus au titre. Les états et résultats sont textuels et annoncés via `role=status`/`aria-live`.

Les actions ne reposent pas sur des icônes. Les confirmations sont des dialogues natifs : le focus entre sur Annuler et revient au déclencheur à la fermeture. Les fiches détail utilisent une liste de définitions et les contrôles masqués ne restent pas focalisables.

Vitest vérifie les noms des contrôles et l’échappement du contenu. Playwright/axe couvre le parcours désactivation-réactivation. Restent manuels en préproduction : Tab/Maj+Tab, VoiceOver, zoom 200 %, reflow 320 px, focus après chaque erreur et lecture des tableaux. Aucune conformité RGAA complète n’est déclarée avant cet audit.
