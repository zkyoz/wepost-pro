# Accessibilité — Tâche 21

Le dashboard utilise un tableau avec légende, en-têtes de colonnes et en-têtes de lignes. Chaque état possède un libellé textuel ; la couleur n’est jamais la seule information. Les compteurs ont des termes explicites et la zone est défilable au clavier sur petit écran.

Le bouton d’actualisation est natif et son état désactivé est exposé. Le résultat de l’actualisation et les erreurs sont annoncés dans une zone `aria-live="polite"`. Aucun rafraîchissement automatique, clignotement ou animation imposée n’est utilisé.

Les contrôles automatisés couvrent la présence de la page, du tableau et un audit axe du contenu principal. VoiceOver, zoom 200 %, Tab/Shift+Tab complet et reflow exact à 320 px restent à vérifier en préproduction.
