# Accessibilité — Tâche 12

Les choix compte/confidentialité, la légende, la date, les interactions et la transparence utilisent des contrôles natifs étiquetés. La confirmation d’envoi est explicite. Les statuts et erreurs sont textuels et annoncés avec `aria-live`/`role=alert`; les tentatives sont présentées dans un tableau avec légende et en-têtes. Aucun widget TikTok externe n’est nécessaire.

Vitest couvre la présence des contrôles selon le rôle. Le parcours Playwright couvre OAuth mock, scan axe, validation et programmation. Restent à exécuter en préproduction : Tab/Maj+Tab/Entrée/Espace, VoiceOver, zoom 200 %, reflow 320 px, focus après erreur et lecture de l’historique. Aucune conformité RGAA complète n’est déclarée avant ces contrôles.
